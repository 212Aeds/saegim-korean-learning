"use client";

import { playCorrectAnswerSound,feedbackSoundBlocked,subscribeFeedbackSound } from "./feedback-sound";
import { useEffect, useState } from "react";

export function FeedbackToggle() {
  const [muted, setMuted] = useState(false);
  const [blocked,setBlocked]=useState(feedbackSoundBlocked);
  useEffect(()=>subscribeFeedbackSound(setBlocked),[]);
  useEffect(() => {
    try { setMuted(window.localStorage.getItem("saegim-feedback-muted") === "true"); } catch { /* Storage may be disabled. */ }
  }, []);
  return <button type="button" className="button button-quiet feedback-toggle" aria-pressed={!muted} onClick={() => {
    if(blocked&&!muted){playCorrectAnswerSound();return;}
    const next = !muted;
    setMuted(next);
    try { window.localStorage.setItem("saegim-feedback-muted", String(next)); } catch { /* Keep the control usable. */ }
    if(!next)playCorrectAnswerSound();
  }}>{blocked&&!muted?"Tap to enable practice sounds":`Practice sounds: ${muted ? "off" : "on"}`}</button>;
}
