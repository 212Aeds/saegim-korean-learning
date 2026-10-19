// Lightweight endpoint detection, not speaker identification or a pronunciation score.
// Browser noise suppression remains the primary noise reducer. This high-pass
// filter attenuates rumble without gating quiet phonemes out of the saved audio.
export function recordingPauseMs(value = 3000) {
  return Number.isFinite(value) ? Math.min(10000, Math.max(3000, value)) : 3000;
}
export class MicrophoneActivity {
  ready = false;
  private measuredSamples = 0;
  private ambient: number[] = [];
  private floor = 0.00015;
  private voicedSamples = 0;
  private previousInput = 0;
  private previousOutput = 0;
  private readonly alpha: number;
  constructor(private readonly sampleRate: number) {
    this.alpha = 1 / (1 + 2 * Math.PI * 80 / sampleRate);
  }
  process(input: Float32Array) {
    const samples = new Float32Array(input.length);
    let energy = 0;
    for (let i=0;i<input.length;i++) {
      const value = Number.isFinite(input[i]) ? input[i] : 0;
      const filtered = this.alpha * (this.previousOutput + value - this.previousInput);
      this.previousInput=value;this.previousOutput=filtered;
      samples[i]=filtered;energy+=filtered*filtered;
    }
    const rms = Math.sqrt(energy / Math.max(1,input.length));
    if (!this.ready) {
      this.ambient.push(rms);this.measuredSamples+=input.length;
      if (this.measuredSamples >= this.sampleRate * 0.25) {
        this.ambient.sort((a,b)=>a-b);
        this.floor=Math.max(0.00015,this.ambient[Math.floor((this.ambient.length-1)/2)]);
        this.ready=true;this.ambient=[];
      }
      return {samples,rms,speaking:false,continuing:false};
    }
    const threshold=Math.max(0.0006,this.floor*2.4);
    let activeSamples=0;
    if (rms>threshold) for(const sample of samples) if(Math.abs(sample)>threshold)activeSamples++;
    const continuing=activeSamples>=input.length*0.1;
    this.voicedSamples=continuing ? this.voicedSamples+activeSamples : 0;
    const speaking=this.voicedSamples>=this.sampleRate*0.08;
    if (rms<threshold) this.floor=this.floor*0.98+Math.max(0.00015,rms)*0.02;
    return {samples,rms,speaking,continuing};
  }
}
