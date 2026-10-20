# Startup performance pass

## Evidence and changes
The static export referenced 1,228,918 raw JavaScript bytes / 395,794 gzip bytes at baseline commit 70559c1. Named lesson, account, onboarding, review, speaking, practice, tutor and learning-collection interfaces were eagerly included despite being closed or inactive on the landing page.

These components now use Next dynamic imports, with a status message during real code loading. After the change the exported home HTML references 1,081,392 raw bytes / 354,508 gzip bytes: 12.0% fewer raw bytes and 10.4% fewer gzip bytes. Measurements sum unique script src files from the same production export, using Node gzip defaults, and include legacy polyfills even if a modern browser does not execute them. This is a reproducible asset-size comparison, not a measured LCP/INP or total browser transfer claim.

Section navigation previously showed a fixed 240 ms loading overlay regardless of actual work. That timer and overlay were removed. Existing section transition animations remain. Real deferred code displays loading status only while loading.

npm run perf:startup reports the same build metric and fails above 360,000 gzip bytes; hosted builds invoke it after successful export. This gives future changes an explicit startup budget to review, not a reason to remove tests or silently weaken the limit.

## Verification
155 tests passed. Production hosted export/typecheck passed, and the startup budget passed. Browser checks on the production export opened guest onboarding, optional lesson modal, speaking/listening controls and practice rounds through their new deferred chunks. No account/progress data from the real user or microphone recordings were used.

No providers, model weights, voices, credentials, usage caps or paid services changed. Existing guest access and nonblocking account restoration remain. Free API cold starts, network conditions, first-use voice setup and AI inference latency still vary; this change does not make a claim about those timings or physical-device speed.
