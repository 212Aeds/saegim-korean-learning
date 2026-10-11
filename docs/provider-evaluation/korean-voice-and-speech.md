# Korean voice and speech provider evaluation

**Reviewed:** 2026-10-09
**Status:** Provider candidate identified; not approved for production calls
**Decision:** Azure Speech is the current single-vendor candidate for both Korean TTS and short-clip transcription. Keep both features disabled until an account-level billing limit and the planned project/account request caps are configured. This is not a final vendor or voice selection.

## Requirements and decision boundary

Sori must remain free to learners. Provider calls are project-funded, consented where learner data is involved, bounded by per-account and project usage controls, and fail closed when limits are absent. Provider credentials stay server-side. For speech recognition, Sori accepts short recordings, returns text only, and does not keep raw recordings or transcripts. Authored TTS audio may be generated and cached only after voice selection and licensing review.

The product plan calls for three or four stable Korean voice choices chosen after Korean-speaker audition. No such audition has been completed in this evaluation. Four provider voice IDs are verified in Microsoft’s current catalog and mapped below to provisional stable Sori candidate IDs. They are not approved, exposed, or auditioned. No sample assets or voice-specific license conclusions exist yet.

## Candidate comparison

| Capability | Azure Speech (candidate) | Google Cloud (comparison) |
| --- | --- | --- |
| Korean TTS | Azure documents the four verified candidate IDs below: two Neural HD and two Standard voices. Availability does not establish naturalness or suitability. | Google Cloud TTS has a Neural2 family and published per-character pricing. This pass did not verify a Korean Neural2 voice shortlist suitable for the required 3–4 distinct options. |
| Korean speech-to-text | Azure's language support documentation lists Korean (`ko-KR`) for Speech to Text. | Google Cloud Speech-to-Text lists Korean (`ko-KR`) support, including short and long recognition models in supported regions. |
| Indicative published cost | Azure's pricing page advertises a monthly free tier of 5 hours standard real-time STT and 0.5 million neural TTS characters. Paid usage is pay-as-you-go; actual rates depend on region, account, and offer. Check the deployed account before enabling. | Google lists Neural2 TTS at $16 per million characters after a 1-million-character monthly free allowance. Speech-to-Text standard usage is priced by audio minute/model/API; the published V1 page lists 60 minutes/month free for the data-logging SKU and paid usage thereafter. Verify exact SKU, API, region, and terms before any use. |
| Retention and training | Azure's real-time STT privacy documentation says audio is processed in server memory, not stored at rest, and not retained. Its prebuilt TTS privacy page says input text and generated audio are not stored. These non-retention statements do not establish whether inputs/outputs are used for model training or service improvement. Training-use terms are unresolved for both paths and remain a provider-selection gate; do not treat non-retention as proof that training does not occur. | This evaluation does not establish Google retention or training terms for the proposed exact API/configuration. Do not select Google for learner audio until those terms are reviewed. |
| Request quotas | Real-time STT concurrency: F0 1 request; S0 100 by default. Real-time TTS: F0 20 transactions per 60 seconds; S0 30 transactions/second by default. These are provider resource quotas, not project cost caps. Configure stricter Sori-side request-rate/concurrency ceilings; keep the separate daily usage caps independently bounded. | Not evaluated in this pass. |
| Fit | One documented vendor covers Korean TTS and STT, and its service-specific privacy pages describe non-retention for these two paths. Training-use terms remain unresolved. Candidate for a small, capped implementation only after audition, training-terms review, and billing controls. | A credible comparison option, but Korean voice shortlist and exact data terms have not been resolved in this pass. No evidence-based quality ranking is available. |

## Candidate voice identifiers (not approved)

Microsoft’s current catalog verifies these four Korean (`ko-KR`) provider identifiers. The stable Sori IDs below are proposed internal IDs only; they must not be enabled or exposed until a Korean speaker auditions them and the product owner accepts the result.

| Candidate Sori ID | Microsoft provider voice ID | Catalog voice type | Status |
| --- | --- | --- | --- |
| `ko-sunhi-hd-candidate` | `ko-KR-SunHi:DragonHDLatestNeural` | Neural HD, female | Awaiting Korean-speaker audition; not approved |
| `ko-hyunsu-hd-candidate` | `ko-KR-Hyunsu:DragonHDLatestNeural` | Neural HD, male | Awaiting Korean-speaker audition; not approved |
| `ko-sunhi-standard-candidate` | `ko-KR-SunHiNeural` | Standard, female | Awaiting Korean-speaker audition; not approved |
| `ko-injoon-standard-candidate` | `ko-KR-InJoonNeural` | Standard, male | Awaiting Korean-speaker audition; not approved |

These are a bounded shortlist, not a final selection. Candidate IDs may be renamed or removed after audition.

## Evidence checked

All links below are official provider documentation or pricing pages, checked 2026-10-09.

- Microsoft [Speech language and voice support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support) lists Korean voice names and language support. The four exact candidate IDs above were checked in its current catalog.
- Microsoft [Speech quotas and limits](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-services-quotas-and-limits) documents real-time STT concurrency limits and real-time TTS transaction limits for F0 and S0. F0 quotas are not adjustable; S0 defaults may be adjustable as described in the page.
- Microsoft [Speech pricing](https://azure.microsoft.com/en-us/pricing/details/speech/) describes the free tier and pay-as-you-go model. Prices can vary with region, account, offer, and configuration; use the actual Azure account's pricing view before enabling paid calls.
- Microsoft [Speech-to-text data privacy and security](https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/speech-service/speech-to-text/data-privacy-security) describes real-time audio handling, including in-memory processing and no retention.
- Microsoft [Text-to-speech data privacy and security](https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/speech-service/text-to-speech/data-privacy-security) says prebuilt TTS input and output are not stored.
- Google [Text-to-Speech pricing](https://cloud.google.com/text-to-speech/pricing) gives the Neural2 free allowance and per-character price.
- Google [Speech-to-Text pricing](https://cloud.google.com/speech-to-text/pricing) gives model/API-specific per-minute pricing; storage and other paired Google Cloud services can add charges.
- Google [Speech-to-Text supported languages](https://cloud.google.com/speech-to-text/v2/docs/speech-to-text-supported-languages) lists Korean `ko-KR` and model/region availability.

Pricing and service catalogs change. Recheck the linked official pages and billing account immediately before implementation and periodically thereafter.

## Training-use review gate

This evaluation has not established whether Azure uses real-time STT audio/transcripts or prebuilt TTS text/audio to train models or improve services. The cited privacy pages establish non-retention behavior for specific service flows, not training-use exclusions. Before provider selection, review the applicable Azure product terms, data protection terms, and account configuration for these exact services and confirm in writing/documentation whether customer data is used for training or service improvement and whether an opt-out is needed. Keep provider-backed features disabled if this remains unresolved.

## Voice audition and licensing gate

Before publishing any provider voice in Sori:

1. Ask a Korean speaker to compare candidates using the same representative authored phrases, including varied sentence endings, common particles, and vocabulary with potentially ambiguous pronunciation.
2. Assess natural pacing, intelligibility, and pronunciation. The current list is a shortlist only; do not expose every listed voice.
3. Select at most four voices and assign stable Sori IDs only after the audition. Record exact provider voice identifiers, sample phrase/audio asset, date, reviewer, and outcome in this document or the audio asset metadata.
4. Verify the current provider terms permit generating, caching, and serving the authored audio in Sori. A language-support listing is not a license grant. No final voice-level licensing review has been recorded yet.

Until this gate passes, use existing browser/device TTS fallback; do not claim a selected provider voice is natural or approved.

## Limits and enablement gate

No numeric hard cap has been selected. Do not infer one from a provider's free allowance. Free allowances are not a project budget and may change or depend on account eligibility.

Before enabling requests, configure both:

- A provider-side account billing budget/limit or equivalent control verified for the actual subscription and region. Confirm whether the chosen control blocks spend or only sends alerts; an alert alone is not a hard limit.
- Sori's configured project daily and per-account daily limits (`PROVIDER_DAILY_LIMIT` and `PROVIDER_ACCOUNT_DAILY_LIMIT`, per implementation plan), enforced before provider calls and failing closed if either is absent. Also enforce Sori-side request-rate/concurrency ceilings below the applicable provider quotas. Exact values remain undecided.

Also set request timeouts, input/duration/size validation, aggregate usage accounting, and controlled unavailable responses. Never put credentials in client code or logs. This evaluation chooses no numeric value and does not authorize live provider calls.

## Storage and learner-data handling

Object storage/CDN is still undecided. Select and configure it in a separate implementation decision, with access control, immutable cache keys, and retention appropriate for reviewed authored audio. Do not store recordings or transcripts in object storage, Postgres, logs, or learner progress. For transcription, hold the validated short clip in request memory only, send it to the configured STT provider after explicit consent, discard it when the request completes, and return only transcript text. Keep typed practice available when consent, provider configuration, or limits prevent transcription.

## Outcome

Azure Speech is the current provisional candidate for a single TTS/STT integration because its official materials document Korean support, four exact voice IDs, provider request quotas, and service-specific non-retention statements. No final provider or voice is selected. Korean-speaker audition, exact voice licensing review, training-use terms, account billing hard-stop verification, numeric project budget approval, and storage selection remain open. Until those are completed, provider-backed features must remain disabled and fail closed.
