# Node security runtime update — 2026-10-22

Render advisory: https://render.com/docs/advisory-emudhra

Both hosted services previously pinned Node 24.21.0. The API runtime and static-site build now pin 24.22.1, the patched release in the same major. Both dashboard environment values were saved as well as render.yaml. Rebuilding native services refreshes Render's system certificate store; upgrading Node also updates its bundled trust store and runtime security fixes.

This is an AI-assisted configuration change. No application logic, voice presets, authentication, accounts, progress, provider settings, usage caps, or billing settings were changed. The local developer Node installation remains 24.21.0: 212 local tests, API build, and hosted website build passed there; patched-runtime verification must come from Render build logs. Four existing local preview tests remain untracked and are not deployed.

Deployment verification: pending. Keep the patched runtime if an application rollback is necessary; do not roll back Node to the vulnerable version. PHP guidance does not apply to the current hosted services.

Deployment caught Blueprint drift: its old TUTOR_PROVIDER default reset the dashboard's existing Cloudflare tutor. Restored cloudflare and changed the Blueprint entry to sync:false so future runtime syncs preserve the chosen provider. No paid provider was enabled. The first static build still reported 24.21.0; corrected the saved value after revealing the nonsecret field, verified 24.22.1 persisted, and rebuilding again. API build confirmed 24.22.1 and reached Live; final verification pending.

Final verification (2026-10-23): commit 191963a deployed Live to API dep-dbdgdkjrjlhs73d70r7g and static site dep-dbdgdjlg1s2s73bdr0n0. Both logs explicitly report Node 24.22.1. API startup preflight passed. Website, proxied health, and direct health returned HTTP 200; health confirms database connected. An unauthenticated speech/status request correctly returned 401. Fresh browser homepage hydrated with the existing session intact. TUTOR_PROVIDER saved as cloudflare before the final API rebuild. No microphone or private messages submitted. Optional compromised-certificate probe from the service runtime was not performed (no production shell access used).

Separate audit note: API build reports zero npm vulnerabilities. Root/build npm audit reports three entries through the development-only neon CLI (@hono/node-server moderate, diff low, neon moderate). Its proposed automatic fix is a major CLI downgrade; not applied as part of the Node runtime patch. This is not a claim of a vulnerability-free app.
