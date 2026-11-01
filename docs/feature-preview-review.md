# Local feature trial — awaiting creator review

The creator asked to try ideas before deciding whether to implement them publicly. Do not enable SAEGIM_FEATURE_PREVIEW on hosted services or add these features to the live navigation without their approval. No public deployment or account migration was performed for this trial.

Open http://localhost:3028/feature-preview while the local preview process is running.

Included: one short scripted conversation with introduction/thanks branches and a clear stopping point; a private browser-only phrase collection with optional recorded Chris/Jessica clips for known phrases; explanation practice using three existing lesson samples and their source-specific teaching notes. The conversation is scripted, not a new AI integration. Existing materials and dictionary reference components are reused; editorial review is still pending where indicated.

This trial intentionally does not add community posting, notifications, analytics, new account data, streak points or payments. These three features were the prior recommendation to build first. Existing weekly goals and review remain in the main app.

Preview phrase data uses only saegim-feature-preview-phrasebook-v1, not account or guest progress keys. It can be lost if browser data is cleared. No phrase text is uploaded to an API. Native audio plays only after user action; leaving a feature stops its clip. The preview flag is off for ordinary production builds and the exported preview route contains a not-found page rather than the trial UI.

Verification: 163 automated tests passed. Hosted production build/typecheck passed with preview disabled, and the startup-size guard passed (354,423 gzip bytes locally). Browser checks covered a wrong greeting, both branches, completion, saving a phrase, persistence after reload, source-correct explanation feedback, and recorded playback starting. Physical phone testing and subjective voice quality are not claimed.

Feedback to ask for: Which feature would you use again? Where were you unsure what to do? Did the ending feel complete? Would the phrasebook be useful for family conversations? What should be removed rather than expanded?

To restart locally in PowerShell from the repository root:

```powershell
$env:SAEGIM_FEATURE_PREVIEW='true'
$env:SORI_WEB_DIST_DIR='.next-feature-preview'
npm --workspace @sori/web run dev -- --port 3028
```

The local dev server is a preview convenience and does not host AI models or replace public services.
