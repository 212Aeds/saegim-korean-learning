const { readFile, writeFile } = require('node:fs/promises');
const { resolve } = require('node:path');
const { createHash } = require('node:crypto');
async function main() {
  const root = resolve(__dirname, '..');
  const directory = resolve(root, 'apps/api/db/seeds');
  const manifest = JSON.parse(await readFile(resolve(directory, 'source-manifest.json'), 'utf8'));
  const batch = manifest.sources.find((source) => source.source === 'cc-kedict').batches.find((batch) => batch.sourceRevision);
  const response = await fetch(`https://raw.githubusercontent.com/mhagiwara/cc-kedict/${batch.sourceRevision}/${batch.sourceFile}`);
  if (!response.ok) throw new Error('Cannot fetch the pinned dictionary source.');
  const bytes = Buffer.from(await response.arrayBuffer());
  if (createHash('sha256').update(bytes).digest('hex') !== batch.sourceSha256) throw new Error('Dictionary source checksum does not match the audited manifest.');
  const words = new Set();
  for (const source of manifest.sources) for (const sourceBatch of source.batches) {
    const entries = JSON.parse(await readFile(resolve(directory, sourceBatch.file), 'utf8'));
    entries.forEach((entry) => words.add(entry.korean ?? entry.word));
  }
  const lines = {};
  bytes.toString('utf8').split('\n').forEach((line, index) => {
    if (!line.startsWith('- word: ')) return;
    const word = line.slice(8).trim().replace(/^["']|["']$/g, '');
    if (words.has(word) && !lines[word]) lines[word] = index + 1;
  });
  await writeFile(resolve(root, 'apps/web/app/word-reference-index.json'), JSON.stringify({ revision: batch.sourceRevision, lines }, null, 2) + '\n');
  console.log(`Pinned dictionary references indexed for ${Object.keys(lines).length} headwords; other entries retain explicit dictionary lookups and app authorship.`);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
