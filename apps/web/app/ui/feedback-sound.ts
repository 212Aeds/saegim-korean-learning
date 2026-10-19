let audioContext: AudioContext | null = null;

let resuming: Promise<void> | null = null;
function muted() {
  try { return window.localStorage.getItem("saegim-feedback-muted") === "true"; } catch { return false; }
}
function contextForSound() {
  if (typeof window === "undefined" || !window.AudioContext || muted()) return null;
  if (!audioContext || audioContext.state === "closed") { audioContext = new AudioContext(); resuming = null; }
  return audioContext;
}
function resumeSound(context: AudioContext) {
  if (context.state === "running") return Promise.resolve();
  resuming ??= context.resume().finally(()=>{resuming=null;});
  return resuming;
}
// Call from a tap, before waiting for recording or server responses.
export function unlockPracticeSounds() {
  try { const context=contextForSound(); if(context) void resumeSound(context).catch(()=>{}); } catch { /* Optional audio. */ }
}
export function playCorrectAnswerSound() {
  try {
    const context=contextForSound(); if(!context)return;
    const play=()=>{
      if (muted() || context.state !== "running") return;
      const now=context.currentTime;
      for (const [offset,frequency] of [[0,659.25],[0.105,783.99]] as const) {
        const tone=context.createOscillator(),volume=context.createGain();
        tone.type="sine";tone.frequency.value=frequency;
        volume.gain.setValueAtTime(0.0001,now+offset);
        volume.gain.exponentialRampToValueAtTime(0.075,now+offset+0.015);
        volume.gain.exponentialRampToValueAtTime(0.0001,now+offset+0.24);
        tone.connect(volume);volume.connect(context.destination);
        tone.onended=()=>{tone.disconnect();volume.disconnect();};
        tone.start(now+offset);tone.stop(now+offset+0.25);
      }
    };
    if(context.state==="running")play();else void resumeSound(context).then(play).catch(()=>{});
  } catch { /* Audio remains optional if a browser blocks it. */ }
}
