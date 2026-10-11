import { pipeline } from "@huggingface/transformers";

type AsrMessage = { type: "load" } | { type: "transcribe"; audio: Float32Array };
type AsrResponse =
  | { type: "progress"; detail: string }
  | { type: "ready" }
  | { type: "result"; text: string }
  | { type: "error"; message: string };

type Transcriber = (audio: Float32Array, options: { language: string; task: string }) => Promise<{ text?: string }>;
let transcriber: Transcriber | undefined;
let loadPromise: Promise<void> | undefined;

function send(message: AsrResponse) {
  self.postMessage(message);
}

async function loadModel() {
  if (transcriber) return;
  if (!loadPromise) {
    loadPromise = pipeline("automatic-speech-recognition", "onnx-community/whisper-tiny", {
      device: "wasm",
      dtype: "q8",
      progress_callback: (event: { status?: string; file?: string; progress?: number }) => {
        const file = event.file?.split("/").pop();
        const percent = typeof event.progress === "number" ? ` ${Math.round(event.progress)}%` : "";
        if (event.status === "progress" || event.status === "download") {
          send({ type: "progress", detail: `${file ?? "Speech model"}${percent}` });
        }
      },
    }).then((result) => {
      transcriber = result as Transcriber;
    }).catch((error: unknown) => {
      loadPromise = undefined;
      throw error;
    });
  }
  await loadPromise;
}

self.addEventListener("message", (event: MessageEvent<AsrMessage>) => {
  const message = event.data;
  if (message.type === "load") {
    void loadModel().then(() => send({ type: "ready" })).catch((error: unknown) => {
      send({ type: "error", message: error instanceof Error ? error.message : "The offline model could not load." });
    });
    return;
  }
  void loadModel().then(async () => {
    const result = await transcriber!(message.audio, { language: "korean", task: "transcribe" });
    send({ type: "result", text: result.text?.trim() ?? "" });
  }).catch((error: unknown) => {
    send({ type: "error", message: error instanceof Error ? error.message : "Local speech recognition failed." });
  });
});
