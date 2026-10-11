const { readdir, readFile } = require("node:fs/promises");
const { resolve } = require("node:path");
const { Pool } = require("pg");
const { config } = require("dotenv");

const root = resolve(__dirname, "..");
config({ path: resolve(root, ".env.local"), quiet: true });
config({ path: resolve(root, ".env"), quiet: true });

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("Set DATABASE_URL in the root .env.local before running migrations.");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000, max: 1 });
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(30164004)");
    const directory = resolve(root, "apps/api/db");
    const files = (await readdir(directory)).filter((name) => /^\d{3}-.*\.sql$/.test(name)).sort();
    for (const file of files) {
      console.log(`Applying ${file}`);
      await client.query(await readFile(resolve(directory, file), "utf8"));
    }
    await client.query("COMMIT");
    console.log(`Database ready: ${files.length} idempotent migrations applied.`);
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    // Connection error messages may contain credentials or host details.
    throw new Error(`Database setup failed; no migrations committed (${error.code ?? "connection or SQL error"}).`);
  } finally {
    client?.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
