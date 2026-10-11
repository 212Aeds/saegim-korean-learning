# Sori

Sori is a free, mobile-first Korean-learning app. Korean studies require an account so lessons, review cards, and speaking practice can sync across devices. The current beginner path has 20 lessons, a 1,050-entry Korean-English dictionary, three-step spaced review, and a 100-card speaking deck.

## Run locally

Requires Node.js 20.9 or newer.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set `DATABASE_URL` plus the allowed frontend origins in `WEB_ORIGINS`.
3. Copy `apps/web/.env.example` to `apps/web/.env.local`; set `NEXT_PUBLIC_API_URL=http://localhost:4000` for local API development.
4. Start PostgreSQL and apply the SQL files in `apps/api/db/` in numeric order.
5. Seed the dictionary with `npm run db:seed:words`.
6. Run `npm run dev` and open `http://localhost:3000`.

For the included local database, run `npm run db:up` before the API. Docker Compose applies the migrations automatically for a fresh volume. For an existing volume, apply the next unapplied migration manually, for example:

```sh
docker compose exec -T db psql -U sori -d sori -f /docker-entrypoint-initdb.d/003-content.sql
```

The API listens on port `4000`, requires `DATABASE_URL`, and verifies its database connection at startup. The frontend gates study screens on an authenticated account and needs `NEXT_PUBLIC_API_URL` configured. Without a reachable account service, sign-in is unavailable and study content stays locked.

## Neon

This workspace is linked to Neon project `withered-morning-17483094`, branch `production`. `neon.ts` declares Postgres only; `neon deploy` currently reports no policy changes. Neon CLI writes branch connection variables to the ignored root `.env.local`; the API loads that file for local development and deployment commands. Apply all SQL migrations in order, then run `npm run db:seed:words` to populate the 1,050-entry dictionary. Neon CLI context and credentials are local setup data; keep them out of source control.

## Learning content and source

The 1,050-entry dictionary adaptation is generated from [cc-kedict](https://github.com/mhagiwara/cc-kedict), under CC BY-SA 3.0. See [the attribution and reuse notes](apps/api/db/seeds/ATTRIBUTION.md). The corpus has not been individually reviewed by a Korean-fluent editor, so it is a broad reference bank rather than a validated beginner frequency list. Lesson vocabulary is curated separately in the web app.

## Account and operations

Accounts use salted scrypt password hashes, random 30-day HttpOnly sessions, CORS credentials, and shared PostgreSQL throttling. The API stores the session token only as a hash and scopes progress to the signed-in account. Learners can export or delete account data. Email verification and password-reset email are not implemented; account recovery needs to be added before broad public launch.

## Build

Run `npm run build` to compile both the Next.js app and NestJS API. Start production processes with `npm run start:web` and `npm run start:api` after setting production environment variables.

Speaking uses the best Korean voice available from the learner's device, with voice and pace controls; quality depends on browser and operating-system voices. There is no AI conversation, pronunciation scoring, social feature, or subscription.
