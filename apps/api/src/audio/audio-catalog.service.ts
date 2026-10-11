import { Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { z } from "zod";
import { DatabaseService } from "../database.service";
import { AudioStorage } from "./audio-storage";

const voiceSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
  label: z.string().trim().min(1).max(60),
  locale: z.literal("ko-KR"),
  modelVersion: z.string().trim().min(1).max(100),
  sampleAssetId: z.string().uuid(),
  auditionApproved: z.literal(true),
  licensingReviewed: z.literal(true),
}).strict();
export type CatalogVoice = z.infer<typeof voiceSchema>;

export function configuredVoices(): CatalogVoice[] {
  // Cached media remains available once its provider terms have been reviewed.
  if (process.env.AUDIO_CATALOG_ENABLED !== "true" ||
      process.env.PROVIDER_TERMS_REVIEWED !== "true") return [];
  try {
    const parsed = z.array(voiceSchema).min(1).max(4).parse(JSON.parse(process.env.AUDIO_REVIEWED_VOICES ?? ""));
    if (new Set(parsed.map((voice) => voice.id)).size !== parsed.length ||
        parsed.some((voice) => voice.id.includes("candidate"))) return [];
    return parsed;
  } catch { return []; }
}

export function audioContentKey(text: string) {
  return createHash("sha256").update(text.normalize("NFC").trim().replace(/\s+/g, " ")).digest("hex");
}

@Injectable()
export class AudioCatalogService {
  constructor(private readonly database: DatabaseService, private readonly storage: AudioStorage) {}

  private async availableVoices() {
    const configured = configuredVoices();
    if (!this.storage.isAvailable() || !configured.length) return [];
    try {
      const result = await this.database.query<{ id: string; voice_id: string; model_version: string }>(
        "SELECT id, voice_id, model_version FROM korean_audio_assets WHERE id = ANY($1::uuid[]) AND reviewed = true",
        [configured.map((voice) => voice.sampleAssetId)],
      );
      return configured.filter((voice) => result.rows.some((row) => row.id === voice.sampleAssetId &&
        row.voice_id === voice.id && row.model_version === voice.modelVersion));
    } catch { return []; }
  }

  async voices() {
    return (await this.availableVoices()).map(({ id, label, locale, sampleAssetId }) => ({ id, label, locale, sampleAssetId }));
  }

  async lookup(contentKey: string, voiceId: string) {
    if (!/^[a-f0-9]{64}$/.test(contentKey)) throw new NotFoundException("Audio is unavailable.");
    const voice = (await this.availableVoices()).find((item) => item.id === voiceId);
    if (!voice) throw new NotFoundException("Audio is unavailable.");
    try {
      const result = await this.database.query<{ id: string }>(
        `SELECT id FROM korean_audio_assets
         WHERE content_key = $1 AND voice_id = $2 AND model_version = $3 AND reviewed = true`,
        [contentKey, voice.id, voice.modelVersion],
      );
      if (result.rows[0]) return { assetId: result.rows[0].id };
    } catch { throw new ServiceUnavailableException("Audio is temporarily unavailable."); }
    throw new NotFoundException("Audio is unavailable for this phrase. Use the device voice.");
  }

  async read(assetId: string) {
    if (!z.string().uuid().safeParse(assetId).success) throw new NotFoundException("Audio is unavailable.");
    const voices = await this.availableVoices();
    if (!voices.length) throw new ServiceUnavailableException("Audio is temporarily unavailable.");
    try {
      const result = await this.database.query<{
        voice_id: string; model_version: string; storage_key: string;
        checksum: string; byte_length: number; content_type: string;
      }>("SELECT voice_id, model_version, storage_key, checksum, byte_length, content_type FROM korean_audio_assets WHERE id = $1 AND reviewed = true", [assetId]);
      const row = result.rows[0];
      if (!row || !voices.some((voice) => voice.id === row.voice_id && voice.modelVersion === row.model_version)) {
        throw new NotFoundException("Audio is unavailable.");
      }
      const asset = await this.storage.read(row.storage_key);
      if (asset.bytes.length !== row.byte_length || asset.contentType !== row.content_type ||
          createHash("sha256").update(asset.bytes).digest("hex") !== row.checksum.trim()) throw new Error();
      return asset;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new ServiceUnavailableException("Audio is temporarily unavailable. Use the device voice.");
    }
  }
}
