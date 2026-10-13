import "reflect-metadata";
import { config } from "dotenv";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

config({ path: "../../.env.local" });
config({ path: "../../.env" });

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Full-course review collections exceed Express's 100 KB default.
  // Keep a bounded request envelope; the progress schema also caps each field.
  app.useBodyParser("json", { limit: "2mb" });
  app.setGlobalPrefix("v1");
  const webOrigins = (
    process.env.WEB_ORIGINS ??
    process.env.WEB_ORIGIN ??
    "http://localhost:3000"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedWebOrigins = new Set(webOrigins);
  app.enableCors({
    origin: (origin, callback) => {
      const isLocalDevelopmentOrigin =
        process.env.NODE_ENV !== "production" &&
        origin !== undefined &&
        /^http:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(origin);

      if (!origin || allowedWebOrigins.has(origin) || isLocalDevelopmentOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS"), false);
    },
    credentials: true,
  });
  app.use((_, response, next) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    if (process.env.NODE_ENV === "production") {
      response.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains",
      );
    }
    next();
  });
  await app.listen(process.env.PORT ?? 4000, "0.0.0.0");
}

void bootstrap();
