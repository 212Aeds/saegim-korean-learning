import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Pool, PoolClient, QueryResultRow } from "pg";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      })
    : null;

  async onModuleInit() {
    if (!this.pool) throw new Error("DATABASE_URL is required to start Sori API");
    await this.pool.query("SELECT 1");
  }

  async query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
    if (!this.pool) throw new Error("DATABASE_URL is not configured");
    return this.pool.query<T>(text, values);
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
