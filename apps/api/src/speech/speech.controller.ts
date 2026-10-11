import {
  BadRequestException, Body, Controller, Get, Header, HttpException,
  Injectable, NestMiddleware, Post, Req, ServiceUnavailableException, StreamableFile, UseGuards,
} from "@nestjs/common";
import { raw, type NextFunction, type Request, type Response } from "express";
import { SessionAuthGuard, type SessionRequest } from "../session-auth.guard";
import { KoreanSpeechProvider, SpeechProviderError } from "./speech-provider";
import { SpeechAudioCacheService } from "./speech-audio-cache.service";

const maxBytes = 2 * 1024 * 1024;
const maxSeconds = 15;

@Injectable()
export class SpeechClipMiddleware implements NestMiddleware {
  private readonly parse = raw({ type: () => true, limit: maxBytes, inflate: false });

  use(request: Request, response: Response, next: NextFunction) {
    const discard = () => {
      if (Buffer.isBuffer(request.body)) request.body.fill(0);
      request.body = undefined;
    };
    // Guards can reject before the controller's finally block runs.
    response.once("finish", discard);
    response.once("close", discard);
    // Reject unsupported uploads before buffering them. Only uncompressed PCM
    // WAV is accepted so duration can be verified from the actual data chunk.
    if (request.header("x-sori-speech-consent") !== "true") {
      throw new BadRequestException("Consent is required for each recording.");
    }
    if (request.header("content-type")?.trim().toLowerCase() !== "audio/wav") {
      throw new BadRequestException("Use a PCM WAV recording.");
    }
    this.parse(request, response, (error?: { status?: number }) => {
      if (error) {
        next(new HttpException("The recording could not be accepted.", error.status === 413 ? 413 : 400));
        return;
      }
      next();
    });
  }
}

function validateWav(audio: Buffer) {
  const invalid = () => new BadRequestException("Use a valid mono PCM WAV clip of up to 15 seconds and 2 MB.");
  if (audio.length < 44 || audio.length > maxBytes ||
      audio.toString("latin1", 0, 4) !== "RIFF" || audio.toString("latin1", 8, 12) !== "WAVE" ||
      audio.readUInt32LE(4) + 8 !== audio.length) throw invalid();
  let offset = 12;
  let sampleRate = 0;
  let dataBytes = 0;
  let foundFormat = false;
  let foundData = false;
  while (offset + 8 <= audio.length) {
    const name = audio.toString("latin1", offset, offset + 4);
    const size = audio.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + size;
    if (end > audio.length) throw invalid();
    if (name === "fmt ") {
      if (foundFormat || size !== 16 || audio.readUInt16LE(start) !== 1 ||
          audio.readUInt16LE(start + 2) !== 1 || audio.readUInt16LE(start + 14) !== 16 ||
          audio.readUInt16LE(start + 12) !== 2) throw invalid();
      sampleRate = audio.readUInt32LE(start + 4);
      if (sampleRate < 8_000 || sampleRate > 96_000 || audio.readUInt32LE(start + 8) !== sampleRate * 2) throw invalid();
      foundFormat = true;
    } else if (name === "data") {
      if (foundData || !foundFormat || !size || size % 2 !== 0) throw invalid();
      dataBytes = size;
      foundData = true;
    } else {
      // A canonical browser WAV needs no metadata or extra embedded chunks.
      throw invalid();
    }
    offset = end + (size % 2);
  }
  const durationSeconds = dataBytes / (sampleRate * 2);
  if (offset !== audio.length || !foundFormat || !foundData || durationSeconds > maxSeconds) throw invalid();
  return durationSeconds;
}

@Controller("speech")
@UseGuards(SessionAuthGuard)
export class SpeechController {
  constructor(private readonly provider: KoreanSpeechProvider, private readonly cache: SpeechAudioCacheService) {}

  private available() {
    return this.provider.isAvailable() && process.env.PROVIDER_TERMS_REVIEWED === "true";
  }

  @Get("status")
  @Header("Cache-Control", "private, no-store")
  status() { return { available: this.available(), transcription: this.available(), synthesis: this.available(), voices: ["jessica", "chris"] }; }

  @Post("synthesize")
  @Header("Cache-Control", "private, no-store")
  async synthesize(@Req() request: SessionRequest, @Body() body: unknown) {
    const value = body && typeof body === "object" ? body as Record<string, unknown> : {};
    const text = typeof value.text === "string" ? value.text.normalize("NFC").trim().replace(/\s+/gu, " ") : "";
    const voice = value.voice;
    if (!text || text.length > 500 || !/[\uac00-\ud7a3]/u.test(text) || (voice !== "jessica" && voice !== "chris")) {
      throw new BadRequestException("Enter a short Korean phrase and choose Jessica or Chris.");
    }
    if (!this.available() || !request.soriAccountId) throw new ServiceUnavailableException("Natural speech is unavailable. Device speech is still available.");
    try {
      const cached = await this.cache.get(text, voice);
      if (cached) return new StreamableFile(cached.audio, { type: cached.contentType, length: cached.audio.byteLength });
    } catch {
      // A cache outage should not disable speech; generate the clip on demand.
    }
    try {
      const result = await this.provider.synthesize(text, voice);
      let audio: Buffer<ArrayBufferLike> = Buffer.from(result.audio);
      try { audio = (await this.cache.store(text, voice, audio)).audio; } catch { /* Keep this response usable when caching is unavailable. */ }
      return new StreamableFile(audio, { type: result.contentType, length: audio.byteLength });
    } catch (error) {
      if (process.env.NODE_ENV !== "production" && error instanceof SpeechProviderError) {
        const status = error.upstreamStatus ? ` (${error.upstreamStatus})` : "";
        console.warn(`[speech] Natural voice failed: ${error.code}${status}`);
      }
      if (error instanceof SpeechProviderError && error.upstreamStatus === 401) {
        throw new ServiceUnavailableException("Natural voice setup needs attention: OpenRouter rejected the API key. The app owner must update OPENROUTER_API_KEY and restart the API.");
      }
      throw new ServiceUnavailableException("Natural speech could not be generated. Device speech is still available.");
    }
  }

  @Post("transcribe")
  @Header("Cache-Control", "private, no-store")
  async transcribe(@Req() request: SessionRequest) {
    const audio = Buffer.isBuffer(request.body) ? request.body : undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      if (request.header("x-sori-speech-consent") !== "true") throw new BadRequestException("Consent is required for each recording.");
      if (request.header("content-type") !== "audio/wav" || !audio) throw new BadRequestException("Use a PCM WAV recording.");
      validateWav(audio);
      if (!this.available() || !request.soriAccountId) throw new ServiceUnavailableException("Speech is unavailable. Type your response instead.");
      try {
        const result = await Promise.race([
          this.provider.transcribe(audio, "audio/wav", "ko-KR"),
          new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error()), 15_000); }),
        ]);
        if (typeof result?.transcript !== "string" || result.transcript.length > 2_000 || !result.transcript.trim()) throw new Error();
        return { transcript: result.transcript.trim() };
      } catch {
        throw new ServiceUnavailableException("Speech could not be transcribed. Try again or type your response.");
      }
    } finally {
      if (timeout) clearTimeout(timeout);
      audio?.fill(0);
      request.body = undefined;
    }
  }
}
