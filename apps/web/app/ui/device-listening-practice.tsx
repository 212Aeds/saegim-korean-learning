"use client";
import {MatchingVoiceSetup} from "./matching-voice-setup";
import {useGuestLearning} from "./guest-learning";
import { useEffect, useRef, useState } from "react";
import { ListeningControls } from "./listening-controls";
import { KoreanInput } from "./korean-keyboard";
import { WordReference } from "./word-reference";
import { matchesPracticeAnswer, practiceAnswerNote } from "./speech-check";
import {playCorrectAnswerSound} from "./feedback-sound";
import { playElevenLabsKorean, prefetchLocalKorean, preferredSpeechRate, saveElevenLabsVoice, saveSpeechRate, selectedElevenLabsVoice, stopKoreanPlayback, type ElevenLabsVoice } from "./speech";

export function DeviceListeningPractice({korean, expectedRomanization, selectedVoice, selectedPace, onVoiceChange, onPaceChange, onResult}: {
  korean: string; expectedRomanization?: string; selectedVoice?: ElevenLabsVoice; selectedPace?: number;
  onVoiceChange?: (voice: ElevenLabsVoice) => void; onPaceChange?: (rate: number) => void;
  onResult?: (transcript: string, matches: boolean) => void;
}) {
  const guest=useGuestLearning();
  const [voice,setVoice] = useState(selectedVoice ?? selectedElevenLabsVoice);
  const [pace,setPace] = useState(selectedPace ?? preferredSpeechRate);
  const [written,setWritten] = useState("");
  const [notice,setNotice] = useState("");
  const [busy,setBusy] = useState(false);
  const attempt = useRef(0);
  function stop() { attempt.current++; stopKoreanPlayback(); setBusy(false); }
  useEffect(() => {
    if (selectedVoice) setVoice(selectedVoice);
    if (selectedPace !== undefined) setPace(selectedPace);
  },[selectedVoice,selectedPace]);
  useEffect(() => {
    setWritten(""); setNotice(""); setBusy(false);
    void prefetchLocalKorean(korean,voice);
    return () => { attempt.current++; stopKoreanPlayback(); };
  },[korean,voice]);
  async function listen() {
    const current = ++attempt.current;
    setBusy(true); setNotice("");
    try {
      const result = await playElevenLabsKorean(korean,voice,pace,{waitForEnd:true});
      if (current === attempt.current && !result.played) setNotice("Audio is unavailable. Try another voice, or practice by writing.");
    } catch { if (current === attempt.current) setNotice("Audio could not start. Please try again."); }
    finally { if (current === attempt.current) setBusy(false); }
  }
  return <section className="speech-practice" aria-label="Korean listening and writing practice">
    <span className="micro-label">LISTEN & RECALL</span>
    <p>{guest ? "Guest practice uses listening and writing. An optional account enables speech recognition." : "Listen, say it aloud, then try writing it from memory."}</p>
    <ListeningControls voice={voice} pace={pace}
      onVoiceChange={value=>{stop();setVoice(value);saveElevenLabsVoice(value);onVoiceChange?.(value);}}
      onPaceChange={value=>{stop();setPace(value);saveSpeechRate(value);onPaceChange?.(value);}} />
    <div className="speech-actions"><button type="button" className="button button-soft" disabled={busy} onClick={()=>void listen()}>{busy ? "Listening…" : "Listen to Korean"}</button>
      <button type="button" className="button button-quiet" disabled={!busy} onClick={stop}>Stop audio</button></div>
    <MatchingVoiceSetup text={korean} voice={voice}/>
    <form onSubmit={event=>{event.preventDefault();const matches=matchesPracticeAnswer(korean,written,expectedRomanization);setNotice(matches?practiceAnswerNote(korean,written)||"That matches the target wording.":"Compare with the target and try again. Another wording may also be valid.");if(matches&&!onResult)playCorrectAnswerSound();onResult?.(written,matches);}}>
      <KoreanInput value={written} onChange={setWritten} label={expectedRomanization ? "Write Korean or romanization" : "Write the Korean target"} maxLength={500} openOnFocus={false}/>
      <button className="button button-dark" disabled={!written.trim()}>Check written response</button>
    </form><WordReference word={korean}/>{notice && <p role="status">{notice}</p>}
  </section>;
}
