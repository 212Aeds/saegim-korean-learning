"""One-time download of pinned, licensed voice weights; inference is offline."""
import os
from pathlib import Path
from huggingface_hub import snapshot_download

target = Path(os.getenv("LOCAL_TTS_MODEL_DIR") or Path(__file__).resolve().parents[2] / "work/supertonic-3")
snapshot_download("supertone-oss-archive/supertonic-3",
    revision="aafc6e32416a594460b32413efc49d7fe4ce6d46", local_dir=target,
    allow_patterns=["onnx/*", "voice_styles/*", "LICENSE", "README.md"])
print(f"Local voice assets ready: {target}")
