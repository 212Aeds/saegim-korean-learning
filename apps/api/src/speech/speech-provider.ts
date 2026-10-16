import { cloudflareAvailable, cloudflareRequest, usesCloudflareSpeech } from "../cloudflare-ai";
import { Injectable } from "@nestjs/common";

export abstract class KoreanSpeechProvider {
  abstract isAvailable(): boolean;
  // An enabled adapter must bound and cancel its own network request within
  // 15 seconds and never retain or log audio/transcripts.
  abstract transcribe(audio: Uint8Array, contentType: string, locale: "ko-KR"): Promise<{ transcript: string }>;
  abstract synthesize(text: string, voice: "jessica" | "chris"): Promise<{ audio: Uint8Array; contentType: "audio/mpeg" }>;
}

// Safe fallback used when provider configuration is absent.
export class UnavailableKoreanSpeechProvider extends KoreanSpeechProvider {
  isAvailable() { return false; }

  async transcribe(_audio: Uint8Array, _contentType: string, _locale: "ko-KR"): Promise<never> {
    throw new Error("Speech transcription is unavailable.");
  }

  async synthesize(_text: string, _voice: "jessica" | "chris"): Promise<never> {
    throw new Error("Speech synthesis is unavailable.");
  }
}

const endpoint = "https://openrouter.ai/api/v1";
const transcriptionModel = "openai/whisper-large-v3";
const synthesisModel = "elevenlabs/eleven-v4-turbo";
export const speechModelVersion = synthesisModel;
const timeoutMs = 15_000;
const maxAudioBytes = 5 * 1024 * 1024;

export class SpeechProviderError extends Error {
  constructor(
    readonly code: "upstream-http" | "invalid-audio" | "empty-audio" | "oversized-audio" | "network",
    readonly upstreamStatus?: number,
  ) {
    super(code);
  }
}

@Injectable()
export class OpenRouterKoreanSpeechProvider extends KoreanSpeechProvider {
  isAvailable() {
    return usesCloudflareSpeech() ? cloudflareAvailable() : process.env.PAID_FEATURES_ENABLED === "true" && process.env.OPENROUTER_AUDIO_ENABLED === "true" && Boolean(process.env.OPENROUTER_API_KEY?.trim());
  }

  async transcribe(audio: Uint8Array, contentType: string, locale: "ko-KR") {
    if (!this.isAvailable() || contentType !== "audio/wav" || audio.byteLength > 2 * 1024 * 1024) throw new Error("Speech unavailable");
    if(usesCloudflareSpeech()) {
      const value=await cloudflareRequest("whisper",{audio:Buffer.from(audio).toString("base64"),language:"ko",task:"transcribe",vad_filter:true,condition_on_previous_text:false}) as {text?:unknown};
      if(typeof value.text!=="string" || value.text.length>2000)throw Error("Invalid transcription response");
      return {transcript:value.text};
    }
    const result = await this.request("/audio/transcriptions", {
      model: transcriptionModel,
      language: locale === "ko-KR" ? "ko" : "ko",
      temperature: 0,
      input_audio: { data: Buffer.from(audio).toString("base64"), format: "wav" },
    });
    const parsed = result as { text?: unknown };
    if (typeof parsed.text !== "string") throw new Error("Invalid transcription response");
    return { transcript: parsed.text };
  }

  async synthesize(text: string, voice: "jessica" | "chris") {
    if (usesCloudflareSpeech()) throw Error("Hosted voice synthesis is not configured");
    if (!this.isAvailable() || text.length > 500 || !/[\uac00-\ud7a3]/u.test(text)) throw new Error("Speech unavailable");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${endpoint}/audio/speech`, {
        method: "POST",
        signal: controller.signal,
        headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY?.trim()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: synthesisModel, input: text, voice, response_format: "mp3" }),
      });
      if (!response.ok) throw new SpeechProviderError("upstream-http", response.status);
      if (!response.headers.get("content-type")?.toLowerCase().startsWith("audio/mpeg")) throw new SpeechProviderError("invalid-audio");
      const contentLength = Number(response.headers.get("content-length"));
      if (Number.isFinite(contentLength) && contentLength > maxAudioBytes) throw new SpeechProviderError("oversized-audio");
      const reader = response.body?.getReader();
      if (!reader) throw new SpeechProviderError("invalid-audio");
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.byteLength;
        if (size > maxAudioBytes) { await reader.cancel(); throw new SpeechProviderError("oversized-audio"); }
        chunks.push(part.value);
      }
      if (!size) throw new SpeechProviderError("empty-audio");
      return { audio: Buffer.concat(chunks, size), contentType: "audio/mpeg" as const };
    } catch (error) {
      if (error instanceof SpeechProviderError) throw error;
      throw new SpeechProviderError("network");
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
  }

  private async request(path: string, body: unknown) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${endpoint}${path}`, {
        method: "POST",
        signal: controller.signal,
        headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY?.trim()}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("Provider failure");
      const contentLength = Number(response.headers.get("content-length"));
      if (Number.isFinite(contentLength) && contentLength > 8_192) throw new Error("Provider response too large");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Provider response unavailable");
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.byteLength;
        if (size > 8_192) { await reader.cancel(); throw new Error("Provider response too large"); }
        chunks.push(part.value);
      }
      return JSON.parse(Buffer.concat(chunks, size).toString("utf8")) as unknown;
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
  }
}
