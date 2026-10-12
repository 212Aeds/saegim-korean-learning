"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { LearningProfile } from "../learning-profile";
import { KoreanInput } from "./korean-keyboard";
import { WordReference } from "./word-reference";
import { transcriptRomanization } from "./transcript-romanization";
import { conversationHistory, shouldSendConversationKey, type ConversationTurn } from "./conversation-history";
import { playElevenLabsKorean, selectedElevenLabsVoice, saveElevenLabsVoice, stopKoreanPlayback, type ElevenLabsVoice } from "./speech";

type Reply = { korean: string; english: string; feedback: string };
type Turn = ConversationTurn & { reply?: Reply };
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const scenarios = { everyday: "Everyday chat", cafe: "At a café", travel: "Exploring Korea", friends: "With a friend" };

export function TutorConversation({ profile }: { profile: LearningProfile }) {
  const [scenario, setScenario] = useState<keyof typeof scenarios>("everyday");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [notice, setNotice] = useState("");
  const [voice, setVoice] = useState<ElevenLabsVoice>("jessica");
  const [readReplies, setReadReplies] = useState(false);
  const [playing, setPlaying] = useState(false);
  const request = useRef<AbortController | null>(null);
  const log = useRef<HTMLDivElement | null>(null);
  useEffect(() => { setVoice(selectedElevenLabsVoice()); return () => { request.current?.abort(); stopKoreanPlayback(); }; }, []);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "auto" }); }, [turns.length, thinking]);

  async function listen(text: string) {
    setPlaying(true);
    try {
      const result = await playElevenLabsKorean(text, voice, 1, { naturalOnly: true });
      if (!result.played) setNotice("The selected voice could not play right now. You can keep chatting and try Listen again.");
    } finally { setPlaying(false); }
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    const clean = draft.trim().replace(/\s+/gu, " ").slice(0, 600);
    if (!clean || request.current) return;
    if (!apiUrl) { setNotice("Conversation practice is temporarily unavailable. Your message is still here."); return; }
    const controller = new AbortController(); request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 65_000);
    setThinking(true); setNotice("");
    try {
      const response = await fetch(`${apiUrl}/v1/tutor/conversation`, { method: "POST", credentials: "include", cache: "no-store", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversationHistory(turns, clean).map(({ role, content }) => ({ role, content })), level: profile.level, scenario, consent: true }), signal: controller.signal });
      if (!response.ok) {
        if (response.status === 401) throw new Error("Sign in again to continue your conversation.");
        if (response.status === 429) throw new Error("Conversation practice reached the tutor’s current limit. Try again later; your message is still here.");
        throw new Error("Your conversation partner could not reply. Your message is still here; please try again.");
      }
      const reply = await response.json() as Reply;
      if (![reply.korean, reply.english, reply.feedback].every((value) => typeof value === "string" && value.length > 0 && value.length <= 500) || !/[가-힣]/u.test(reply.korean)) throw new Error("The reply was incomplete. Please try again.");
      if (controller.signal.aborted) return;
      setTurns((current) => [...current, { role: "user", content: clean }, { role: "assistant", content: reply.korean, reply }]);
      setDraft((current) => current.trim().replace(/\s+/gu, " ").slice(0, 600) === clean ? "" : current);
      if (readReplies) void listen(reply.korean);
    } catch (error) { if (request.current === controller) setNotice(error instanceof Error ? error.message : "Could not send your message."); }
    finally { window.clearTimeout(timeout); if (request.current === controller) { request.current = null; setThinking(false); } }
  }
  return <section className="tutor-chat-card conversation-card" aria-labelledby="conversation-title">
    <span className="micro-label">PUT YOUR KOREAN INTO PRACTICE</span>
    <h2 id="conversation-title">Have a conversation.</h2>
    <p>A simulated Korean partner who responds to you and remembers recent turns. Start in Korean or ask for help in English.</p>
    <div className="conversation-controls">
      <label>Setting<select value={scenario} disabled={thinking || turns.length > 0} onChange={(event) => setScenario(event.target.value as keyof typeof scenarios)}>{Object.entries(scenarios).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label>Partner’s voice<select value={voice} disabled={playing || thinking} onChange={(event) => { const selected = event.target.value as ElevenLabsVoice; setVoice(selected); saveElevenLabsVoice(selected); }}><option value="jessica">Jessica</option><option value="chris">Chris</option></select></label>
      <label className="conversation-read-toggle"><input type="checkbox" disabled={thinking} checked={readReplies} onChange={(event) => setReadReplies(event.target.checked)} />Read replies aloud</label>
      {turns.length > 0 && <button className="button button-quiet" disabled={thinking} onClick={() => { stopKoreanPlayback(); setTurns([]); setNotice(""); }}>New conversation</button>}
    </div>
    <div ref={log} className="conversation-log" role="log" aria-label="Your Korean conversation" aria-live="polite" aria-relevant="additions">
      {!turns.length && <div className="conversation-empty"><strong>One small message starts an exchange.</strong><p>Try 안녕하세요! or ask your partner to help you order a coffee.</p></div>}
      {turns.map((turn, index) => <article key={index} className={`conversation-turn is-${turn.role}`}><span className="micro-label">{turn.role === "user" ? "YOU" : "YOUR PRACTICE PARTNER"}</span><p lang={turn.role === "assistant" ? "ko" : undefined}>{turn.content}</p>{turn.reply && <>
        <p className="conversation-roman" lang="ko-Latn">{transcriptRomanization(turn.content)}</p>
        <p className="conversation-translation">{turn.reply.english}</p>
        <p className="conversation-feedback">{turn.reply.feedback}</p>
        <button className="button button-soft" disabled={playing} onClick={() => void listen(turn.content)}>Listen with {voice === "chris" ? "Chris" : "Jessica"}</button>
        <WordReference word={turn.content} />
      </>}</article>)}
      {thinking && <p className="conversation-thinking" role="status">Your partner is replying…</p>}
    </div>
    <form className="conversation-form" onSubmit={(event) => void send(event)}>
      <span className="conversation-composer-label">Your message</span>
      <KoreanInput multiline openOnFocus={false} maxLength={600} value={draft} onChange={(value) => setDraft(value.slice(0, 600))} label="Your conversation message" placeholder="Write a Korean reply, or ask for help in English…" onKeyDown={(event) => {
        if (shouldSendConversationKey(event.key, event.shiftKey, event.nativeEvent.isComposing, event.keyCode)) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
      }} />
      <div className="conversation-composer-footer"><small>Enter to send · Shift+Enter for a new line</small><span aria-label="Message characters">{draft.length}/600</span></div>
      <button type="submit" className="button button-dark" disabled={thinking || !draft.trim()}>{thinking ? "Waiting for reply…" : "Send message"}</button>
    </form>
    {notice && <p role="status" className="tutor-service-message is-error">{notice}</p>}
    <small>AI dialogue can contain mistakes. Dictionary links help with vocabulary; they do not verify the generated sentence. This chat stays in this visit; recent messages are sent to generate each reply.</small>
  </section>;
}
