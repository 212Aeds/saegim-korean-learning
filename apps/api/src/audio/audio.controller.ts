import { Controller, Get, Header, Param, Query, StreamableFile, UseGuards } from "@nestjs/common";
import { SessionAuthGuard } from "../session-auth.guard";
import { AudioCatalogService } from "./audio-catalog.service";

@Controller("audio")
@UseGuards(SessionAuthGuard)
export class AudioController {
  constructor(private readonly catalog: AudioCatalogService) {}

  @Get("voices")
  voices() { return this.catalog.voices(); }

  // Resolve a local content hash; authored Korean text is never sent for live TTS.
  @Get("lookup")
  lookup(@Query("contentKey") contentKey = "", @Query("voiceId") voiceId = "") {
    return this.catalog.lookup(contentKey, voiceId);
  }

  @Get(":assetId")
  @Header("Cache-Control", "private, no-store")
  async asset(@Param("assetId") assetId: string) {
    const { bytes, contentType } = await this.catalog.read(assetId);
    return new StreamableFile(Buffer.from(bytes), { type: contentType, length: bytes.length });
  }
}
