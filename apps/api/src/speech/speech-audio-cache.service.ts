import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { DatabaseService } from "../database.service";
import { speechModelVersion } from "./speech-provider";

export type SpeechVoice = "jessica" | "chris";
export type CachedSpeechAudio = { audio: Buffer; contentType: "audio/mpeg" };

@Injectable()
export class SpeechAudioCacheService {
  constructor(private readonly database: DatabaseService) {}

  private key(text: string) {
    return createHash("sha256").update(text.normalize("NFC").trim().replace(/\s+/gu, " ")).digest("hex");
  }

  async get(text: string, voice: SpeechVoice): Promise<CachedSpeechAudio | null> {
    const result = await this.database.query<{ audio_bytes: Buffer; content_type: string; checksum: string }>(
      `SELECT audio_bytes, content_type, checksum FROM korean_speech_cache
       WHERE content_key = $1 AND voice_id = $2 AND model_version = $3`,
      [this.key(text), voice, speechModelVersion],
    );
    const row = result.rows[0];
    if (!row || row.content_type !== "audio/mpeg" || !Buffer.isBuffer(row.audio_bytes) ||
        createHash("sha256").update(row.audio_bytes).digest("hex") !== row.checksum.trim()) return null;
    return { audio: row.audio_bytes, contentType: "audio/mpeg" };
  }

  async store(text: string, voice: SpeechVoice, audio: Uint8Array): Promise<CachedSpeechAudio> {
    const key = this.key(text);
    await this.database.query(
      `INSERT INTO korean_speech_cache (content_key, voice_id, model_version, content_type, audio_bytes, checksum)
       VALUES ($1, $2, $3, 'audio/mpeg', $4, $5)
       ON CONFLICT (content_key, voice_id, model_version) DO NOTHING`,
      [key, voice, speechModelVersion, Buffer.from(audio), createHash("sha256").update(audio).digest("hex")],
    );
    // A simultaneous cache miss may have inserted the canonical copy first.
    return (await this.get(text, voice)) ?? { audio: Buffer.from(audio), contentType: "audio/mpeg" };
  }
}
