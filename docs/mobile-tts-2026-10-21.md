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
