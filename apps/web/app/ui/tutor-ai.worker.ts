import { pipeline } from "@huggingface/transformers";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
type TutorRequest =
  | { type: "load" }
  | { type: "ask"; requestId: number; messages: ChatMessage[] };
type TutorReply =
  | { type: "progress"; detail: string }
  | { type: "ready"; device: "webgpu" | "wasm" }
  | { type: "answer"; requestId: number; text: string }
  | { type: "error"; stage: "load" | "answer"; requestId?: number; message: string };
type GeneratedMessage = { role?: string; content?: string };
type TutorGenerator = (
  messages: ChatMessage[],
  options: {
    max_new_tokens: number;
    do_sample: boolean;
    repetition_penalty: number;
    temperature: number;
    top_k: number;
    top_p: number;
    no_repeat_ngram_size: number;
  },
) => Promise<Array<{ generated_text?: GeneratedMessage[] | string }>>;

let generator: TutorGenerator | undefined;
let loadPromise: Promise<"webgpu" | "wasm"> | undefined;

function send(message: TutorReply) {
  self.postMessage(message);
}

function isDegenerateAnswer(text: string) {
  const cleaned = text.trim();
  if (cleaned.length < 12 || cleaned.length > 1_200) return true;

  const sentenceCounts = new Map<string, number>();
  for (const sentence of cleaned.split(/(?<=[.!?])\s+/u)) {
    const normalized = sentence.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
    if (!normalized) continue;
    const count = (sentenceCounts.get(normalized) ?? 0) + 1;
    if (count > 1) return true;
    sentenceCounts.set(normalized, count);
  }

  const compact = cleaned.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  for (let size = 1; size <= 8; size += 1) {
    for (let start = 0; start + size * 6 <= compact.length; start += 1) {
      const chunk = compact.slice(start, start + size);
      let repeats = 1;
      while (compact.startsWith(chunk, start + repeats * size)) repeats += 1;
      if (repeats >= 6) return true;
    }
  }
  return false;
}

async function loadModel(): Promise<"webgpu" | "wasm"> {
  if (generator) return loadPromise!;
  if (!loadPromise) {
    const hasWebGpu = Boolean((navigator as Navigator & { gpu?: unknown }).gpu);
    const device = hasWebGpu ? "webgpu" : "wasm";
    const dtype = hasWebGpu ? "q4f16" : "q4";
    loadPromise = pipeline("text-generation", "onnx-community/Qwen2.5-0.5B-Instruct", {
      device,
      dtype,
      revision: "516c8d04add8a80c5228f32102b57953b8d421a9",
      progress_callback: (event: { status?: string; file?: string; progress?: number }) => {
        const file = event.file?.split("/").pop();
        const percent = typeof event.progress === "number" ? ` ${Math.round(event.progress)}%` : "";
        if (event.status === "progress" || event.status === "download") {
          send({ type: "progress", detail: `${file ?? "AI tutor model"}${percent}` });
        }
      },
    }).then((result) => {
      generator = result as TutorGenerator;
      return device;
    }).catch((error: unknown) => {
      loadPromise = undefined;
      throw error;
    });
  }
  return loadPromise;
}

self.addEventListener("message", (event: MessageEvent<TutorRequest>) => {
  const request = event.data;
  if (request.type === "load") {
    void loadModel().then((device) => send({ type: "ready", device })).catch((error: unknown) => {
      send({ type: "error", stage: "load", message: error instanceof Error ? error.message : "The local tutor could not load." });
    });
    return;
  }
  void loadModel().then(async () => {
    const output = await generator!(request.messages, {
      max_new_tokens: 150,
      do_sample: true,
      temperature: 0.7,
      top_k: 20,
      top_p: 0.8,
      repetition_penalty: 1.1,
      no_repeat_ngram_size: 4,
    });
    const generated = output[0]?.generated_text;
    const text = Array.isArray(generated)
      ? generated.at(-1)?.content?.trim() ?? ""
      : typeof generated === "string" ? generated.trim() : "";
    if (!text) throw new Error("The tutor generated an empty response. Please try asking another way.");
    if (isDegenerateAnswer(text)) {
      throw new Error("Sori’s small offline model repeated itself. Try rephrasing, or use the reviewed guide for this topic.");
    }
    send({ type: "answer", requestId: request.requestId, text });
  }).catch((error: unknown) => {
    send({
      type: "error",
      stage: "answer",
      requestId: request.requestId,
      message: error instanceof Error ? error.message : "The on-device tutor could not answer this question.",
    });
  });
});
