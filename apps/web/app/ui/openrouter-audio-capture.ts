export const maxClipSeconds = 15;
const maxClipBytes = 2 * 1024 * 1024;

export type OpenRouterCapture = {
  stream: MediaStream;
  context: AudioContext;
  source: MediaStreamAudioSourceNode;
  processor: ScriptProcessorNode;
  mute: GainNode;
  chunks: Float32Array[];
  samples: number;
  timer?: number;
};

export function releaseCapture(capture: OpenRouterCapture | undefined) {
  if (!capture) return;
  window.clearTimeout(capture.timer);
  capture.processor.onaudioprocess = null;
  capture.source.disconnect();
  capture.processor.disconnect();
  capture.mute.disconnect();
  capture.stream.getTracks().forEach((track) => track.stop());
  if (capture.context.state !== "closed") void capture.context.close();
  capture.chunks.forEach((chunk) => chunk.fill(0));
  capture.chunks = [];
}

export function encodeWav(capture: OpenRouterCapture) {
  if (!capture.samples || capture.samples > capture.context.sampleRate * maxClipSeconds || 44 + capture.samples * 2 > maxClipBytes) {
    throw new Error("Keep each practice clip under 15 seconds.");
  }
  const output = new ArrayBuffer(44 + capture.samples * 2);
  const view = new DataView(output);
  const write = (offset: number, value: string) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  write(0, "RIFF"); view.setUint32(4, output.byteLength - 8, true); write(8, "WAVE");
  write(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, capture.context.sampleRate, true); view.setUint32(28, capture.context.sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); write(36, "data"); view.setUint32(40, capture.samples * 2, true);
  let offset = 44;
  for (const chunk of capture.chunks) for (const sample of chunk) {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }
  return output;
}
