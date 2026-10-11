import { Injectable } from "@nestjs/common";
import { createHash, createHmac } from "node:crypto";

export abstract class AudioStorage {
  abstract isAvailable(): boolean;
  abstract put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  abstract read(key: string): Promise<{ bytes: Uint8Array; contentType: string }>;
}

const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
const AUDIO_TYPES = new Set(["audio/mpeg", "audio/wav", "audio/ogg"]);
const hash = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const hmac = (key: string | Uint8Array, value: string) => createHmac("sha256", key).update(value).digest();
const encode = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);

// Neon requires path-style S3 requests and AWS Signature V4. This minimal
// GET/PUT transport uses built-in crypto/fetch; no SDK dependency is installed.
// Official contract: https://neon.com/docs/storage/s3-compatibility
@Injectable()
export class NeonAudioStorage extends AudioStorage {
  private configuration() {
    if (process.env.AUDIO_STORAGE_ENABLED !== "true") return null;
    const { AWS_ENDPOINT_URL_S3: endpoint, AWS_REGION: region,
      AWS_ACCESS_KEY_ID: accessKey, AWS_SECRET_ACCESS_KEY: secretKey,
      AUDIO_STORAGE_BUCKET: bucket } = process.env;
    if (!endpoint || !region || !accessKey || !secretKey || !bucket ||
        !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket) ||
        !/^[a-z0-9-]+$/.test(region)) return null;
    try {
      const url = new URL(endpoint);
      if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
          (url.pathname !== "/" && url.pathname !== "")) return null;
      return { url, region, accessKey, secretKey, bucket };
    } catch { return null; }
  }

  isAvailable() { return this.configuration() !== null; }

  private async request(method: "GET" | "PUT", key: string, body?: Uint8Array, contentType?: string) {
    const config = this.configuration();
    if (!config || !/^[a-zA-Z0-9/_-]+\.[a-z0-9]+$/.test(key) || key.length > 240 ||
        key.split("/").some((part) => !part || part === "." || part === "..")) {
      throw new Error("Audio storage is unavailable.");
    }
    const path = `/${encode(config.bucket)}/${key.split("/").map(encode).join("/")}`;
    const url = new URL(path, config.url);
    const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
    const date = timestamp.slice(0, 8);
    const payloadHash = hash(body ?? new Uint8Array());
    const headers: Record<string, string> = {
      host: url.host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": timestamp,
    };
    if (contentType) headers["content-type"] = contentType;
    // Immutable keys: fail rather than replace previously reviewed audio.
    if (method === "PUT") headers["if-none-match"] = "*";
    const names = Object.keys(headers).sort();
    const signedHeaders = names.join(";");
    const canonicalHeaders = names.map((name) => `${name}:${headers[name]}\n`).join("");
    const canonical = [method, path, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
    const scope = `${date}/${config.region}/s3/aws4_request`;
    const signingKey = hmac(hmac(hmac(hmac(`AWS4${config.secretKey}`, date), config.region), "s3"), "aws4_request");
    const signature = hmac(signingKey, `AWS4-HMAC-SHA256\n${timestamp}\n${scope}\n${hash(canonical)}`).toString("hex");
    headers.authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    try {
      const response = await fetch(url, {
        method, headers, body: body ? Buffer.from(body) : undefined,
        signal: AbortSignal.timeout(10_000), redirect: "error",
      });
      if (!response.ok) { await response.body?.cancel(); throw new Error(); }
      return response;
    } catch { throw new Error("Audio storage is unavailable."); }
  }

  async put(key: string, bytes: Uint8Array, contentType: string) {
    if (!bytes.length || bytes.length > MAX_AUDIO_BYTES || !AUDIO_TYPES.has(contentType)) {
      throw new Error("Invalid audio asset.");
    }
    const response = await this.request("PUT", key, bytes, contentType);
    await response.body?.cancel();
  }

  async read(key: string) {
    const response = await this.request("GET", key);
    const contentType = response.headers.get("content-type")?.split(";")[0] ?? "";
    const declaredLength = Number(response.headers.get("content-length"));
    if (!AUDIO_TYPES.has(contentType) || declaredLength > MAX_AUDIO_BYTES || !response.body) {
      await response.body?.cancel(); throw new Error("Invalid audio asset.");
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.length;
        if (length > MAX_AUDIO_BYTES) throw new Error();
        chunks.push(value);
      }
      if (!length) throw new Error();
      return { bytes: Buffer.concat(chunks), contentType };
    } catch {
      await reader.cancel().catch(() => undefined);
      throw new Error("Audio storage is unavailable.");
    } finally { reader.releaseLock(); }
  }
}
