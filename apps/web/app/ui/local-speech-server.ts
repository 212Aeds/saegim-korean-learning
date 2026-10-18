import { hostedAiEnabled } from "../release";
const hostedApiUrl = process.env.NEXT_PUBLIC_API_URL;
// Explicit build-time opt-in; public static exports keep this unset.
export const localSpeechUrl = process.env.NEXT_PUBLIC_LOCAL_SPEECH_URL?.replace(/\/$/, "");
export function isMono16kWav(buffer:ArrayBuffer) {
  if(buffer.byteLength<44)return false;
  const view=new DataView(buffer);
  const word=(offset:number)=>String.fromCharCode(...new Uint8Array(buffer,offset,4));
  return word(0)==="RIFF" && word(8)==="WAVE" && word(12)==="fmt " && word(36)==="data"
    && view.getUint32(16,true)===16 && view.getUint16(20,true)===1
    && view.getUint16(22,true)===1 && view.getUint32(24,true)===16000
    && view.getUint16(34,true)===16 && view.getUint32(40,true)===buffer.byteLength-44;
}
export async function localSpeechAvailable(): Promise<boolean> {
  if (!localSpeechUrl && !(hostedAiEnabled && hostedApiUrl)) return false;
  try {
    const response = await fetch(localSpeechUrl ? `${localSpeechUrl}/health` : `${hostedApiUrl}/v1/speech/status`, {credentials:localSpeechUrl ? "omit" : "include",signal: AbortSignal.timeout(localSpeechUrl ? 10000 : 75000), cache:"no-store"});
    const body = await response.json();
    return response.ok && (localSpeechUrl ? body.status === "ok" && body.paidFallback === false : body.transcription === true);
  } catch { return false; }
}
export async function transcribeOnLocalServer(blob: Blob, signal?: AbortSignal): Promise<string> {
  if (!localSpeechUrl && !(hostedAiEnabled && hostedApiUrl)) throw Error("Speech is not configured.");
  const raw=await blob.arrayBuffer();
  let wav: Blob;
  if(isMono16kWav(raw)) wav=new Blob([raw],{type:"audio/wav"});
  else {
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(raw);
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
  }
  const form = new FormData(); form.append("audio", wav, "recording.wav");
  const response = await fetch(`${localSpeechUrl || hostedApiUrl}/v1/speech/transcribe`, {
    method:"POST", credentials:localSpeechUrl ? "omit" : "include", headers:localSpeechUrl ? {} : {"Content-Type":"audio/wav","X-Saegim-Speech-Consent":"true"}, body:localSpeechUrl ? form : wav, signal:signal ? AbortSignal.any([signal,AbortSignal.timeout(180_000)]) : AbortSignal.timeout(180_000), cache:"no-store",
  });
  if (!response.ok) {
    throw Error(response.status === 401 ? "Sign in again to use speech. You can still write your answer."
      : response.status === 429 ? "Speech practice has reached its free limit or is busy. Try again later, or write your answer."
      : "Speech could not be checked right now. Try again shortly, or write your answer.");
  }
  const body = await response.json();
  if (typeof body.transcript !== "string" || body.transcript.length > 2000) throw Error("The transcript was incomplete. Try again or write your answer.");
  return body.transcript;
}
