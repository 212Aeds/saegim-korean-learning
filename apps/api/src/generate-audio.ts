import { readFile, stat } from "node:fs/promises";
import { z } from "zod";
import { audioContentKey } from "./audio/audio-catalog.service";

// Local review manifest only. No dotenv, database, provider or storage instance
// is created: provider selection/audition/terms/billing gates have not passed.
const manifestSchema = z.object({
  version: z.literal(1),
  entries: z.array(z.object({
    contentId: z.string().regex(/^(lesson|speaking-card|reviewed-word):[a-z0-9-]+$/).max(120),
    text: z.string().trim().min(1).max(500).regex(/[\uac00-\ud7a3]/),
    source: z.literal("authored"),
    reviewStatus: z.literal("editor_reviewed"),
    reviewedBy: z.string().trim().min(1).max(120),
    reviewedAt: z.iso.datetime(),
    license: z.string().trim().min(1).max(500),
  }).strict()).min(1).max(30),
}).strict();

async function main() {
  const [manifestPath, mode, ...extra] = process.argv.slice(2);
  if (!manifestPath || (mode && mode !== "--validate") || extra.length) {
    throw new Error("Usage: npm run audio:generate -- <reviewed-manifest.json> [--validate]");
  }
  if ((await stat(manifestPath)).size > 128 * 1024) throw new Error("Manifest is too large.");
  const manifest = manifestSchema.parse(JSON.parse(await readFile(manifestPath, "utf8")));
  if (new Set(manifest.entries.map((entry) => entry.contentId)).size !== manifest.entries.length ||
      new Set(manifest.entries.map((entry) => audioContentKey(entry.text))).size !== manifest.entries.length) {
    throw new Error("Manifest contains duplicate authored content.");
  }
  console.log(`Validated ${manifest.entries.length} reviewed authored entries locally.`);
  if (mode !== "--validate") {
    throw new Error("Generation is disabled pending provider selection, voice audition, licensing, training terms and billing cap approval. No requests or uploads were made.");
  }
}

void main().catch(() => {
  // Do not echo JSON, text, file paths, credentials, or raw validation errors.
  console.error("Audio generation unavailable. Supply a bounded reviewed authored manifest and use --validate for local validation. Provider approval gates must be completed before generation can be implemented and enabled.");
  process.exitCode = 1;
});
