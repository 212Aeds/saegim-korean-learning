import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Pool, PoolClient, QueryResultRow } from "pg";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      })
    : null;

  constructor() {
    // pg removes the failed idle client itself. Without a listener the error
    // becomes an uncaught exception and can stop otherwise healthy requests.
    this.pool?.on("error", (error: unknown) => {
      this.reportFailure("idle-connection", error);
    });
  }

  private reportFailure(stage: "idle-connection" | "query", error: unknown) {
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    const allowed = new Set(["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EPIPE",
      "08000", "08003", "08006", "57P01", "57P02", "57P03", "53300", "42P01", "42703", "23505"]);
    // Do not log the error object, message, SQL, parameters or connection URL.
    this.logger.warn(`Database ${stage} failed (${typeof code === "string" && allowed.has(code) ? code : "unknown"}).`);
  }

  async onModuleInit() {
    if (!this.pool) throw new Error("DATABASE_URL is required to start Sori API");
    await this.pool.query("SELECT 1");
  }

  async query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
    if (!this.pool) throw new Error("DATABASE_URL is not configured");
    try {
      return await this.pool.query<T>(text, values);
    } catch (error) {
      this.reportFailure("query", error);
      throw error;
    }
  }

  async transaction<T>(work: (client: PoolClient) => Promise<T>) {
    if (!this.pool) throw new Error("DATABASE_URL is not configured");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }
}
