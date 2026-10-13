// Explicit build-time opt-in; public static exports keep this unset.
export const localSpeechUrl = process.env.NEXT_PUBLIC_LOCAL_SPEECH_URL?.replace(/\/$/, "");
export async function localSpeechAvailable(): Promise<boolean> {
  if (!localSpeechUrl) return false;
  try {
    const response = await fetch(`${localSpeechUrl}/health`, {signal: AbortSignal.timeout(3000), cache:"no-store"});
    const body = await response.json();
    return response.ok && body.status === "ok" && body.paidFallback === false;
  } catch { return false; }
}
export async function transcribeOnLocalServer(blob: Blob, signal?: AbortSignal): Promise<string> {
  if (!localSpeechUrl) throw Error("Local speech is not configured.");
  const context = new AudioContext();
  let wav: Blob;
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const rendering = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
    const source = rendering.createBufferSource(); source.buffer = decoded;
    source.connect(rendering.destination); source.start();
    const mono = (await rendering.startRendering()).getChannelData(0);
    const buffer = new ArrayBuffer(44 + mono.length * 2), view = new DataView(buffer);
    const ascii = (offset: number, value: string) => { for (let i=0; i<value.length; i++) view.setUint8(offset+i,value.charCodeAt(i)); };
    ascii(0,"RIFF"); view.setUint32(4,36+mono.length*2,true); ascii(8,"WAVE"); ascii(12,"fmt ");
    view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
    view.setUint32(24,16000,true); view.setUint32(28,32000,true); view.setUint16(32,2,true); view.setUint16(34,16,true);
    ascii(36,"data"); view.setUint32(40,mono.length*2,true);
    mono.forEach((sample,i) => view.setInt16(44+i*2, Math.round(Math.max(-1,Math.min(1,sample))*32767),true));
    wav = new Blob([buffer],{type:"audio/wav"});
  } finally { await context.close(); }
  const form = new FormData(); form.append("audio", wav, "recording.wav");
  const response = await fetch(`${localSpeechUrl}/v1/speech/transcribe`, {
    method:"POST", body:form, signal:signal ? AbortSignal.any([signal,AbortSignal.timeout(180_000)]) : AbortSignal.timeout(180_000), cache:"no-store",
  });
  const body = await response.json();
  if (!response.ok || typeof body.transcript !== "string") throw Error(body.error || "Local transcription failed.");
  return body.transcript;
}
