---
license: openrail
license_name: bigscience-openrail-m
base_model: Supertone/supertonic-3
base_model_relation: quantized
pipeline_tag: text-to-speech
language:
  - ko
  - en
tags:
  - onnx
  - int8
  - quantized
  - on-device
---

# Supertonic 3 — int8 quantized variants

This is a **modified copy** of [Supertone/supertonic-3](https://huggingface.co/Supertone/supertonic-3).
It is not an official Supertone release. No retraining was done; graph inputs and outputs are
unchanged, so the official Supertonic inference code runs as is.

## Variants

| Variant | Path | Size | What was done | Speed |
|---|---|---|---|---|
| **Quality (default)** | `onnx/` | 105 MB | **Weight-only int8**: Conv / MatMul / Gemm / Gather weights stored as per-channel symmetric int8 with a `DequantizeLinear` node; all activations stay fp32. `duration_predictor` is left fp32 (3.7 MB) so utterance length matches the original exactly. | same as fp32 |
| Fast | `variants/mixed-fast/onnx/` | 105 MB | `text_encoder` and `vector_estimator`: ONNX Runtime dynamic quantization (`quantize_dynamic`, QUInt8, per-channel). `vocoder`: weight-only int8 as above. `duration_predictor`: fp32. | about 2× faster on native multi-threaded CPU |

Both variants share `onnx/tts.json`, `onnx/unicode_indexer.json` and `voice_styles/*.json`
(unmodified copies of the original files).

### Why the vocoder is never dynamically quantized

An earlier revision of this repository dynamically quantized all four graphs. Measured against the
fp32 model with the same noise seed, dynamic quantization of the **vocoder alone** cut output level
to 0.46× and gave the largest spectral error of any module; Korean speech became faint and hard to
understand. Dynamic quantization of the other modules had a small effect. Weight-only int8 keeps
the output level at 0.99× of fp32.

| Configuration | Size | RMS vs fp32 (ko / en) | log-spectral distance (ko / en) |
|---|---|---|---|
| fp32 original | 398 MB | 1.00 / 1.00 | 0 |
| all modules dynamic int8 (old revision) | 102 MB | 0.48 / 0.98 | 3.2 / 2.0 |
| Quality (this repo, `onnx/`) | 105 MB | 0.99 / 0.99 | 0.64 / 0.80 |
| Fast (`variants/mixed-fast/`) | 105 MB | 1.09 / 1.07 | 0.84 / 0.92 |

## License

Distributed under the same **BigScience Open RAIL-M** license as the original model; see
[`LICENSE`](./LICENSE). The use restrictions in Attachment A of that license apply to these
copies and to anything you build with them. Speech generated with this model is AI-synthesised.

Original model © Supertone Inc.
