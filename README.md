# Saegim

The full app with local AI and speech is available through `npm run dev:local`.
See [local full-app setup](docs/local-full-app.md) for the model downloads,
restart commands, and the separate device-only publishing build.

## Optional local speech server

See [local speech setup](apps/local-speech/README.md) for Flask/Waitress,
local Whisper transcription, and MeloTTS Korean playback without paid APIs.
Run `npm run speech:local`, wait for the ready message, and use
`npm run build:local-speech` for the separate local web build.
The normal `build:free` publishing package keeps this connection disabled.

## Device-only publishing build

Run `npm run build:free` to generate a static website in `apps/web/.next-public`.
Upload only that directory's contents to a static host. This version needs no backend
or provider keys: onboarding, Settings, lessons, and review use separate browser storage.
It has no AI Tutor, cloud sync, paid transcription, or generated Jessica/Chris voices.
Local Korean device voices are used when available. Privacy and About pages describe
the device-only beta. Clearing browser data removes progress; Account provides a JSON download.

Paid API providers are disabled by default even if keys remain configured. They require
an explicit `PAID_FEATURES_ENABLED=true`; the publishing client additionally forces paid
features off. Keep paid features disabled for the cost-free release. Existing cloud accounts
and Neon progress are preserved in the separate development version.

Sori is a free, mobile-first Korean-learning app. Korean studies require an account so lessons, review cards, and speaking practice can sync across devices. The current beginner path has 20 lessons, a 1,050-entry Korean-English dictionary, three-step spaced review, and a 100-card speaking deck.

## Run locally

Requires Node.js 20.9 or newer.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set `DATABASE_URL` plus the allowed frontend origins in `WEB_ORIGINS`.
3. Copy `apps/web/.env.example` to `apps/web/.env.local`; set `NEXT_PUBLIC_API_URL=http://localhost:4004` for local API development.
4. Start PostgreSQL (or use your existing Neon connection) and run `npm run db:migrate`. This applies all numbered idempotent SQL migrations in one transaction; existing accounts and progress are preserved.
5. Seed the dictionary with `npm run db:seed:words`.
6. Run `npm run dev` and open `http://localhost:3016`. The launcher works on Windows, macOS, and Linux and builds the current source before serving it.

For the included local database, run `npm run db:up` before the API. Docker Compose applies the migrations automatically for a fresh volume. For an existing volume, use `npm run db:migrate` with DATABASE_URL configured, or apply the next unapplied migration manually, for example:

```sh
docker compose exec -T db psql -U sori -d sori -f /docker-entrypoint-initdb.d/003-content.sql
```

The API listens on port `4004`, requires `DATABASE_URL`, and verifies its database connection at startup. The frontend gates study screens on an authenticated account and needs `NEXT_PUBLIC_API_URL` configured. Without a reachable account service, sign-in is unavailable and study content stays locked.

## Neon

This workspace is linked to Neon project `withered-morning-17483094`, branch `production`. `neon.ts` declares Postgres only; `neon deploy` currently reports no policy changes. Neon CLI writes branch connection variables to the ignored root `.env.local`; the API loads that file for local development and deployment commands. Apply all SQL migrations in order, then run `npm run db:seed:words` to populate the 1,050-entry dictionary. Neon CLI context and credentials are local setup data; keep them out of source control.

## Learning content and source

The 1,050-entry dictionary adaptation is generated from [cc-kedict](https://github.com/mhagiwara/cc-kedict), under CC BY-SA 3.0. See [the attribution and reuse notes](apps/api/db/seeds/ATTRIBUTION.md). The corpus has not been individually reviewed by a Korean-fluent editor, so it is a broad reference bank rather than a validated beginner frequency list. Lesson vocabulary is curated separately in the web app.

## Account and operations

Accounts use salted scrypt password hashes, random 30-day HttpOnly sessions, CORS credentials, and shared PostgreSQL throttling. The API stores the session token only as a hash and scopes progress to the signed-in account. Learners can export or delete account data. Email verification and password-reset email are not implemented; account recovery needs to be added before broad public launch.

## Build

Run `npm run build` to compile both the Next.js app and NestJS API. Start production processes with `npm run start:web` and `npm run start:api` after setting production environment variables.

Speaking supports Jessica and Chris through OpenRouter, with cached audio in PostgreSQL, and device speech as a fallback. Whisper provides transcription; transcript comparison does not measure accent quality. The tutor uses a server-side OpenRouter provider. Configure DATABASE_URL and the server-only provider settings in the ignored root .env.local to enable these services. Sori is free for learners; hosted providers use project-funded credit.

## Restore hosted services on another laptop

Set these values in the ignored root `.env.local`:

```dotenv
DATABASE_URL=<existing Neon connection string>
WEB_ORIGINS=http://localhost:3016
OPENROUTER_API_KEY=<current project API key>
OPENROUTER_AUDIO_ENABLED=true
PROVIDER_TERMS_REVIEWED=true
PROVIDER_MONTHLY_SPEND_CAP_CENTS=500
```

Set `PROVIDER_TERMS_REVIEWED=true` after reviewing the provider terms for speech processing. The current tutor adapter uses OpenRouter directly; legacy Azure, storage, and OpenAI options are not needed. Jessica and Chris speech clips are cached in PostgreSQL, so no separate object-storage credentials are required. Tutor requests use the shared monthly project budget. Speech has no Sori-side usage quota; provider charges still use the project's OpenRouter balance.

Run `npm run db:migrate`, then `npm run dev:api`. The API is ready when `http://localhost:4004/v1/health` reports the database connected. Start the frontend with `npm run dev:web`; accounts, synced progress, tutor, and speech require the API. To populate a fresh dictionary, run `npm run db:seed:words`.
