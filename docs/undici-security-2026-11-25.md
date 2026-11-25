# Undici development-tool security patch

The lockfile selected Undici 7.30.0 through the root Neon CLI development dependency. Updated that single resolved package to 7.30.2, within Neon's existing `^7.28.0` range. No direct dependency, override, provider, credential or application behavior changed.

## Evidence and decision

The official [excessive content-encoding advisory](https://github.com/nodejs/undici/security/advisories/GHSA-xjj6-f33q-929c) describes a response that can terminate a Node process even when the caller catches the fetch rejection. The [7.30.1 security release](https://github.com/nodejs/undici/releases/tag/v7.30.1) fixes that case; [7.30.2](https://github.com/nodejs/undici/releases/tag/v7.30.2) also fixes subsequent redirect/cache, integrity and error-handling findings. Both release notes were checked before updating. No forced audit fix or incompatible version was used.

A synthetic loopback server sent a six-encoding response and closed before its declared body. The first smoke check reproduced an unhandled response-stream error; inspecting the installed manifest showed the old 7.30.0 package was still present despite the updated lockfile. A clean installation from the patched lockfile installed 7.30.2. The committed regression now checks a normal response, then rejects the malformed response in a child process and verifies that the process remains alive to finish normally. No private data or external service is used.

## Verification and limits

- 314 tests passed after the clean install, including the new process-survival regression.
- Hosted frontend and API builds passed.
- Startup JavaScript remains 359,076 gzip bytes under the existing 360,000-byte cap.
- Full npm audit no longer lists Undici or any high-severity finding. It still reports 12 moderate and one low finding; those require separate review.

This patches the installed npm dependency used by development tooling. It does not update Node's bundled HTTP client, change sign-in or inference, establish a user-visible speed gain, or certify every dependency. The API installation described in `render.yaml` excludes the root workspace; no application runtime source or exported feature changed, so no production redeployment was triggered for this tooling-only patch.

AI assistance was used to investigate the advisory, update the resolution, construct the synthetic regression, and run verification. No microphone, physical-device or private learner testing occurred.
