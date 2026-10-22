# Mobile conversation voices: smaller local inference

The previous safety policy blocked unknown-memory iPhones because the desktop model required a large allocation. This change gives phones a separate, explicitly started compact model. It does not change Chris/M1 or Jessica/F1, recorded lessons, authentication, progress, AI quotas, or paid-provider switches.

## Decision and sources

The modified mixed-fast INT8 model is pinned to revision `95618f5d61cef4923c3b802a332fd603723718f7`. Each file has an exact byte count and SHA-256 digest. Its configuration, character index and M1/F1 style files match the existing original manifest hashes. The duration predictor is unchanged, the text encoder and vector estimator use dynamic quantization, and the vocoder uses weight-only quantization. It is a third-party modified artifact, not an official Supertone release. Original and derivative license notices remain available.

- Model creator: https://huggingface.co/askurios8/supertonic-3-int8
- Original: https://huggingface.co/Supertone/supertonic-3
- Runtime quantization tradeoffs: https://onnxruntime.ai/docs/performance/model-optimizations/quantization.html

## Behavior

Phone detection selects the mobile profile and 105,653,868 bytes of assets, versus the existing desktop model. Phones do not silently download model weights; Prepare conversation voices, Listen or Start voice conversation starts preparation from the learner's action. Recorded clips need no setup. Progress and cancellation remain available. The worker uses single-thread WASM for the mobile profile instead of trying WebGPU first. Downloads are verified before loading and cached per pinned revision where browser storage permits. No conversation text is sent to the weight-file host; generation stays on the device. Low-memory devices explicitly reporting 2GB or less still use recorded audio and text conversation. Unknown memory is no longer automatically rejected solely because Safari omits the memory hint.

## Evidence and limits

Six synthetic Korean samples (greeting, living room, price question, both presets) generated finite, non-silent audio through the installed ONNX Runtime Web WASM backend on a Windows laptop. One separate-process run of each model measured peak RSS at 1,013 MiB for the original and 580 MiB for the compact model. This is total Node process peak memory, not Safari tab memory, and is not a controlled repeated latency benchmark. Sample durations matched the original model for all six fixtures. RMS checks only catch silence/invalid output; they do not establish native pronunciation quality or identical timbre.

No physical iPhone, Android, Wi-Fi or cellular-device validation is claimed. Smaller weights and measured laptop memory reduction justify a mobile beta path, not universal compatibility. First-time preparation still needs a substantial download; cold synthesis is not zero-lag. Runtime failures must keep text chat usable. Native-speaker review and the user's iPhone retest remain necessary.

AI assistance was used for investigation, code and synthetic tests. The engineering decision was based on pinned artifacts and actual local inference rather than treating the model card's performance claims as measured results for Saegim.

The actual browser-worker check also passed: the production worker initialized the mobile profile, verified the remote files, and generated WAVs for both presets from synthetic living-room/price-question text. Both audio controls entered playback and returned to play. This was the desktop in-app browser executing the mobile engine path, not Safari emulation.

## Listen/read-aloud follow-up

The live desktop tutor was observed stuck at “Finishing voice setup… 99%”; its read-aloud checkbox was disabled by voice readiness. Removed unused warm-up synthesis from initialization so ready means inference sessions loaded, not that two unsolicited greetings completed. The checkbox now accepts input before readiness and initiates preparation, with errors next to the controls. It reads future replies, explicitly explained in the interface.

Browser playback may reject `play()` with `NotAllowedError` after asynchronous synthesis (https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play). The playback result now distinguishes that rejection. The generated clip stays cached, the learner is asked to tap Listen again, and cached replay invokes `audio.play()` synchronously in the next tap without awaiting another synthesis promise. A synthetic policy test rejects the first delayed play and confirms direct replay succeeds with only one synthesis request.

Verification uses the actual TutorConversation component and speech.ts wrapper in a 390px local fixture, synthetic iPhone policy and intercepted synthetic conversation reply. The fixture does not call the real tutor or send account data. This is more complete than the earlier worker-only audio-controls test, while still not a physical Safari test. AI assistance was used for diagnosis, implementation and tests.


## Phone controls, native playback and startup follow-up

Removed the home page's 1.5-second automatic model-preparation timer. Public landing content no longer competes with desktop model initialization solely because someone opens the homepage. The tutor still prepares its engine when opened on eligible desktops, and phones prepare on request. This is removal of identifiable background work, not a measured homepage wall-clock speed guarantee.

Read-aloud now uses a full-size button with switch semantics and visible On/Off state. A failed setup no longer silently resets that preference. The reusable audio element is attached to the conversation UI with native controls; it appears once generated audio metadata loads. Successful and autoplay-blocked generated sources remain valid for native replay, until replaced/stopped/unmounted. Previously a blocked play or completed play revoked that source, defeating a native player. Synthetic rejection tests verify that the generated blob URL remains readable and cached replay needs no second inference.

Synthesis now uses 8 denoising steps, the upstream documented default: https://github.com/supertone-oss-archive/supertonic/blob/main/web/README.md . M1/F1 presets, model files, speaking rate, gain, padding and recorded lessons stay unchanged. Six short Korean fixtures across both voices had finite, non-silent output with the same durations. Sequential Windows Node/WASM runs measured median generation at 1,627.5 ms (8 steps) and 4,002.5 ms (16 steps); evidence JSON is saved alongside the earlier reports. These are single runs on a laptop, with no controlled repeated benchmark or native Korean acoustic review, and cannot establish an iPhone speed or identical-quality result.

The actual conversation component was tested at a 390x844 browser viewport with synthetic phone policy and an intercepted synthetic reply: switch On, automatic speech, completed reply, direct native Play/replay. Viewport testing is not physical touchscreen or Safari testing. No learner microphone or private prompts were used. Free-only configuration and account progress are unchanged. AI assistance was used for the implementation and test fixtures.


The learner subsequently requested automatic preparation without model-download notices. A lightweight download-only preload now runs four seconds after the page load event, separate from inference startup. It streams pinned files into the browser cache without building ONNX sessions or materializing full model buffers in application JavaScript. It shares concurrent preload calls, skips cached assets, respects Save-Data, and is canceled before explicit synthesis setup to avoid competing transfers. The inference worker still verifies every size/hash before using cache contents. Desktop and phone callers now both select the verified compact model (legacy explicit desktop profile remains available internally), so the background files match what will be used. Public progress says Preparing audio rather than listing model components. The first visit still fetches assets and can need preparation time; cache availability is not guaranteed. This supersedes earlier notes saying phone downloads always wait for a button press.
