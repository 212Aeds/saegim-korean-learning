"use client";
import type { ElevenLabsVoice } from "./speech";

export function ListeningControls({ voice, pace, onVoiceChange, onPaceChange, disabled = false, label = "Listening pace" }: {
  voice: ElevenLabsVoice; pace: number; onVoiceChange: (voice: ElevenLabsVoice) => void;
  onPaceChange: (pace: number) => void; disabled?: boolean; label?: string;
}) {
  return <div className="listening-controls">
    <label>Korean voice<select value={voice} disabled={disabled} onChange={event => onVoiceChange(event.target.value as ElevenLabsVoice)}><option value="jessica">Jessica</option><option value="chris">Chris</option></select></label>
    <label><span>{label} <strong>{pace.toFixed(2)}×</strong></span><input aria-label={label} type="range" min="0.65" max="1.4" step="0.05" value={pace} disabled={disabled} onChange={event => onPaceChange(Number(event.target.value))} /><small>Slower ← → Faster</small></label>
  </div>;
}
