"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { LearningProfile } from "../learning-profile";
import { KoreanInput } from "./korean-keyboard";
import { WordReference } from "./word-reference";
import { transcriptRomanization } from "./transcript-romanization";
import {
  conversationHistory,
  shouldSendConversationKey,
  type ConversationTurn,
} from "./conversation-history";
import {
  playElevenLabsKorean,
  selectedElevenLabsVoice,
  saveElevenLabsVoice,
  stopKoreanPlayback,
  type ElevenLabsVoice,
} from "./speech";
import { voiceTiming, thinkingPause } from "./conversation-timing";
import { recordConversationTurn } from "./conversation-recording";
import { conversationGuides, conversationSituations } from "./conversation-guide";
type Reply = { korean: string; english: string; feedback: string };
type Turn = ConversationTurn & { reply?: Reply; partner?: ElevenLabsVoice };
import { localSpeechUrl, transcribeOnLocalServer } from "./local-speech-server";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
function PartnerAvatar({ voice }: { voice: ElevenLabsVoice }) {
  return (
    <span className={`partner-avatar is-${voice}`} aria-hidden="true">
      {voice === "chris" ? "C" : "J"}
      <i />
    </span>
  );
}
export function TutorConversation({ profile }: { profile: LearningProfile }) {
  const [turns, setTurns] = useState<Turn[]>([]),
    [draft, setDraft] = useState(""),
    [thinking, setThinking] = useState(false),
    [notice, setNotice] = useState(""),
    [voice, setVoice] = useState<ElevenLabsVoice>("jessica"),
    [playing, setPlaying] = useState(false),
    [calling, setCalling] = useState(false),
    [phase, setPhase] = useState(""),
    [level, setLevel] = useState(0);
  const [pendingMessage, setPendingMessage] = useState("");
  const [pace,setPace] = useState(1);
  const [speakReplies,setSpeakReplies] = useState(false);
  const [pausedForThinking, setPausedForThinking] = useState(false);
  const [canSendTurn, setCanSendTurn] = useState(false);
  const [scenario, setScenario] = useState<(typeof conversationSituations)[number]["id"]>("everyday");
  const listeningAttempt=useRef(0);
  const guide = conversationGuides[profile.level];
  const situation = conversationSituations.find((item) => item.id === scenario)!;
  const koreanTurns = turns.filter((turn) => turn.role === "user" && /[가-힣]/u.test(turn.content)).length;
  const sendTurn = useRef<(() => void) | null>(null),
    readyToSpeak = useRef<(() => void) | null>(null);
  const request = useRef<AbortController | null>(null),
    call = useRef<AbortController | null>(null),
    history = useRef<Turn[]>([]),
    log = useRef<HTMLDivElement | null>(null),
    mounted = useRef(true);
  function stopCall() {
    call.current?.abort();
    call.current = null;
    request.current?.abort();
    stopKoreanPlayback();
    setCalling(false);
    setPausedForThinking(false);
    setCanSendTurn(false);
    setPhase("");
    setLevel(0);
  }
  useEffect(() => {
    mounted.current = true;
    setVoice(selectedElevenLabsVoice());
    setPace(1);
    return () => {
      mounted.current = false;
      listeningAttempt.current++;
      call.current?.abort();
      request.current?.abort();
      stopKoreanPlayback();
    };
  }, []);
  useEffect(() => {
    log.current?.scrollTo({
      top: log.current.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }, [turns.length, thinking, pendingMessage]);
  async function listen(text: string, partner = voice) {
    const attempt=++listeningAttempt.current;
    setPlaying(true);
    try {
      const result = await playElevenLabsKorean(text, partner, pace, {
        naturalOnly: true,
        waitForEnd: true,
      });
      if (!result.played && mounted.current && attempt===listeningAttempt.current)
        setNotice("Voice playback is unavailable. You can continue by typing.");
    } finally {
      if (mounted.current && attempt===listeningAttempt.current) setPlaying(false);
    }
  }
  async function replyTo(text: string, signal?: AbortSignal): Promise<Reply> {
    if (!apiUrl)
      throw new Error("Conversation practice is temporarily unavailable.");
    const controller = new AbortController();
    request.current = controller;
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) controller.abort();
    const timer = window.setTimeout(abort, process.env.NEXT_PUBLIC_LOCAL_TUTOR_ENABLED === "true" ? 125000 : 65000);
    setThinking(true);
    setPendingMessage(text);
    try {
      const response = await fetch(`${apiUrl}/v1/tutor/conversation`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationHistory(history.current, text).map(
            ({ role, content }) => ({ role, content }),
          ),
          level: profile.level,
          scenario,
          consent: true,
        }),
        signal: controller.signal,
      });
      if (!response.ok)
        throw new Error(
          response.status === 429
            ? "Your conversation limit has been reached. Try again later."
            : response.status === 401
              ? "Sign in again to continue."
              : "Your partner could not reply. Please try again.",
        );
      const reply = (await response.json()) as Reply;
      if (
        ![reply.korean, reply.english, reply.feedback].every(
          (value) =>
            typeof value === "string" &&
            value.length > 0 &&
            value.length <= 500,
        ) ||
        !/[가-힣]/u.test(reply.korean)
      )
        throw new Error("The reply was incomplete. Please try again.");
      if (controller.signal.aborted)
        throw new DOMException("Stopped", "AbortError");
      history.current = [
        ...history.current,
        { role: "user", content: text },
        { role: "assistant", content: reply.korean, reply, partner: voice },
      ];
      setTurns(history.current);
      return reply;
    } finally {
      window.clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      if (request.current === controller) {
        request.current = null;
        if (mounted.current) {
          setThinking(false);
          setPendingMessage("");
        }
      }
    }
  }
  async function sendMessage(message: string) {
    const text = message.trim().replace(/\s+/gu, " ").slice(0, 600);
    if (!text || request.current || calling || playing) return;
    setDraft(text);
    setNotice("");
    try {
      const reply = await replyTo(text);
      setDraft((current) => (current === text ? "" : current));
      if (speakReplies && mounted.current) await listen(reply.korean);
    } catch (error) {
      if (mounted.current)
        setNotice(
          error instanceof DOMException && error.name === "AbortError" ? "Reply stopped. Your message is still here." :
          error instanceof Error
            ? error.message
            : "Could not send your message.",
        );
    }
  }
  async function send(event: FormEvent) { event.preventDefault(); await sendMessage(draft); }
  async function startCall() {
    if (call.current || request.current || playing) return;
    const controller = new AbortController();
    call.current = controller;
    setCalling(true);
    setNotice("");
    const sessionTimeout = window.setTimeout(() => {
      controller.abort();
      stopKoreanPlayback();
      if (mounted.current)
        setNotice(
          "Your ten-minute conversation is paused. Start again when you’re ready.",
        );
    }, 600_000);
    let wav: ArrayBuffer | undefined;
    try {
      const started = Date.now();
      for (
        let turn = 0;
        turn < 10 &&
        !controller.signal.aborted &&
        Date.now() - started < 10 * 60 * 1000;
        turn++
      ) {
        let text =
          turn === 0 ? draft.trim().replace(/\s+/gu, " ").slice(0, 600) : "";
        if (!text) {
          setPhase("Listening · speak, then pause");
          wav = await recordConversationTurn(
            controller.signal,
            (value) => {
              if (!controller.signal.aborted) setLevel(value);
            },
            {
              silenceMs: voiceTiming(profile.level).silenceMs,
              onReady: (finish) => {
                sendTurn.current = finish;
                if (!controller.signal.aborted) setCanSendTurn(!!finish);
              },
            },
          );
          setPhase("Transcribing your message…");
          let result: {transcript?:unknown};
          if (localSpeechUrl) result = {transcript:await transcribeOnLocalServer(new Blob([wav],{type:"audio/wav"}),controller.signal)};
          else {
            const response = await fetch(`${apiUrl}/v1/speech/transcribe`, {
              method: "POST",
              credentials: "include",
              cache: "no-store",
              headers: {
                "Content-Type": "audio/wav",
                "X-Saegim-Speech-Consent": "true",
              },
              body: wav,
              signal: AbortSignal.any([
                controller.signal,
                AbortSignal.timeout(20000),
              ]),
            });
            if (!response.ok)
              throw new Error(
                "Your speech could not be transcribed. The conversation is paused.",
              );
            result = await response.json();
          }
          new Uint8Array(wav).fill(0); wav = undefined;
          if (controller.signal.aborted) break;
          if (
            typeof result.transcript !== "string" ||
            !result.transcript.trim()
          )
            throw new Error("No words detected. Please try again.");
          text = result.transcript.trim().replace(/\s+/gu, " ").slice(0, 600);
          setDraft(text);
        }
        if (controller.signal.aborted) break;
        setPhase("Your partner is thinking…");
        const reply = await replyTo(text, controller.signal);
        setDraft("");
        if (controller.signal.aborted) break;
        setPhase(`${voice === "chris" ? "Chris" : "Jessica"} is speaking…`);
        const playback = await playElevenLabsKorean(reply.korean, voice, pace, {
          naturalOnly: true,
          waitForEnd: true,
        });
        if (!playback.played && !controller.signal.aborted)
          throw new Error(
            "Voice playback could not finish. Continue by typing, or try the conversation again.",
          );
        if (!controller.signal.aborted && turn < 9) {
          setPausedForThinking(true);
          await thinkingPause(
            voiceTiming(profile.level).thinkingSeconds,
            controller.signal,
            (seconds) => {
              if (!controller.signal.aborted)
                setPhase(
                  `Think about your reply · microphone off · listening in ${seconds}s`,
                );
            },
            (skip) => {
              readyToSpeak.current = skip;
            },
          );
          setPausedForThinking(false);
        }
      }
      if (!controller.signal.aborted)
        setNotice("Conversation paused. Start again whenever you’re ready.");
    } catch (error) {
      if (!controller.signal.aborted && mounted.current)
        setNotice(
          error instanceof Error
            ? error.message
            : "Voice conversation could not continue.",
        );
    } finally {
      window.clearTimeout(sessionTimeout);
      if (wav) new Uint8Array(wav).fill(0);
      if (call.current === controller) {
        call.current = null;
        if (mounted.current) {
          setCalling(false);
          setPausedForThinking(false);
          setCanSendTurn(false);
          setPhase("");
          setLevel(0);
        }
      }
    }
  }
  return (
    <section
      className="tutor-chat-card conversation-card"
      aria-labelledby="conversation-title"
    >
      <span className="micro-label">YOUR KOREAN, IN CONVERSATION</span>
      <h2 id="conversation-title">A partner for every little exchange.</h2>
      <p>
        Tell your partner what you want to practice. Order lunch, talk about
        your day, or ask for help finding your words.
      </p>
      <div className="chat-partner-bar">
        <PartnerAvatar voice={voice} />
        <div>
          <strong>{voice === "chris" ? "Chris" : "Jessica"}</strong>
          <small>
            Simulated Korean practice partner · adapts to your level
          </small>
        </div>
        <div
          className="partner-switch"
          role="group"
          aria-label="Choose your conversation partner"
        >
          {(["jessica", "chris"] as const).map((partner) => (
            <button
              key={partner}
              className="button button-quiet"
              aria-pressed={voice === partner}
              disabled={calling || thinking || playing}
              onClick={() => {
                setVoice(partner);
                saveElevenLabsVoice(partner);
              }}
            >
              {partner === "chris" ? "Chris" : "Jessica"}
            </button>
          ))}
        </div>
      </div>
      <div className="listening-controls">
        <label><span>Conversation pace <strong>{pace.toFixed(2)}×</strong></span><input aria-label="Conversation pace" type="range" min="0.65" max="1.4" step="0.05" value={pace} disabled={playing || calling} onChange={event=>setPace(Number(event.target.value))} /><small>A gentle natural pace at 1.00×.</small></label>
        <label className="preference-toggle"><input type="checkbox" checked={speakReplies} onChange={event=>setSpeakReplies(event.target.checked)} />Read chat replies aloud</label>
        {playing && <button type="button" className="button button-quiet" onClick={()=>{listeningAttempt.current++;stopKoreanPlayback();setPlaying(false);}}>Stop audio</button>}
      </div>
      <section className="conversation-guide" aria-label="Conversation practice for your level">
        <div><span className="micro-label">YOUR CURRENT STARTING POINT</span><h3>{guide.title}</h3><p>{guide.detail}</p></div>
        <p className="conversation-goal"><strong>Try this today</strong>{guide.goal}</p>
        <div className="conversation-situations" role="group" aria-label="Choose a practice situation">
          {conversationSituations.map((item) => <button type="button" key={item.id} aria-pressed={scenario === item.id} disabled={calling || thinking || playing} onClick={() => { history.current=[];setTurns([]);setNotice("");setScenario(item.id);setDraft(item.prompt); }}>{item.title}</button>)}
        </div>
        {turns.length > 0 && <small>Choosing a situation starts a fresh conversation. You can also describe any topic in your message.</small>}
        <div className="conversation-session-meter"><span><strong>{koreanTurns}</strong> / {guide.turns} Korean replies in this visit</span><progress max={guide.turns} value={Math.min(koreanTurns, guide.turns)} aria-label="Korean replies practiced in this conversation" /></div>
        {koreanTurns >= guide.turns && <p className="conversation-checkpoint" role="status">A little conversation, completed. Keep going or take a break. This counts replies, not fluency or pronunciation.</p>}
      </section>
      <div
        ref={log}
        className="conversation-log"
        role="log"
        aria-label="Your Korean conversation"
        aria-live="polite"
        aria-relevant="additions"
      >
        {!turns.length && !pendingMessage && (
          <div className="conversation-empty">
            <PartnerAvatar voice={voice} />
            <strong>What would you like to talk about?</strong>
            <p>Start in Korean or describe a situation in English.</p>
            <div className="conversation-starters">
              {guide.starters.map((topic) => (
                <button
                  key={topic}
                  className="button button-soft"
                  disabled={calling || thinking}
                  type="button"
                  onClick={() => void sendMessage(topic)}
                >
                  {topic} <span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {turns.map((turn, index) => (
          <article key={index} className={`conversation-turn is-${turn.role}`}>
            {turn.role === "assistant" && (
              <PartnerAvatar voice={turn.partner ?? voice} />
            )}
            <div className="chat-bubble">
              <span className="micro-label">
                {turn.role === "user"
                  ? "YOU"
                  : turn.partner === "chris"
                    ? "CHRIS"
                    : "JESSICA"}
              </span>
              <p lang={turn.role === "assistant" ? "ko" : undefined}>
                {turn.content}
              </p>
              {/[가-힣]/u.test(turn.content) && (
                <p className="conversation-roman" lang="ko-Latn">
                  {transcriptRomanization(turn.content)}
                </p>
              )}
              {turn.reply && (
                <>
                  <details className="chat-help">
                    <summary>Translation & learning tip</summary>
                    <p>{turn.reply.english}</p>
                    <p>{turn.reply.feedback}</p>
                    <WordReference word={turn.content} />
                  </details>
                  <button
                    className="button button-quiet"
                    disabled={playing || calling || thinking}
                    onClick={() => void listen(turn.content, turn.partner)}
                  >
                    ▶ Listen
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
        {pendingMessage && (
          <article className="conversation-turn is-user">
            <div className="chat-bubble">
              <span className="micro-label">YOU · WAITING FOR A REPLY</span>
              <p lang="ko">{pendingMessage}</p>
              {/[가-힣]/u.test(pendingMessage) && (
                <p className="conversation-roman">
                  {transcriptRomanization(pendingMessage)}
                </p>
              )}
            </div>
          </article>
        )}
        {thinking && (
          <p className="conversation-thinking" role="status">
            <span className="typing-dots" aria-hidden="true">
              ● ● ●
            </span>{" "}
            Your partner is replying…
          </p>
        )}
      </div>
      <details className="conversation-phrase-help">
        <summary>Need a phrase to get started?</summary>
        <p lang="ko">{situation.phrase}</p><p className="conversation-roman">{transcriptRomanization(situation.phrase)}</p><p>{situation.meaning}</p>
        <div className="flashcard-tools"><button type="button" className="button button-soft" disabled={calling || thinking} onClick={() => setDraft(situation.phrase)}>Use this phrase</button><button type="button" className="button button-quiet" disabled={calling || thinking || playing} onClick={() => void listen(situation.phrase)}>Listen</button></div>
        <WordReference word={situation.phrase} />
      </details>
      <div className={`voice-conversation-panel ${calling ? "is-active" : ""}`}>
        <div>
          <strong>
            {calling ? "You’re in a voice conversation" : "Talk one on one"}
          </strong>
          <p>
            {calling
              ? phase
              : "Your partner speaks, then listens to your reply. A short pause sends your speech. After the reply, you get time to think; tap Ready to speak to begin sooner."}
          </p>
        </div>
        {calling ? (
          <button className="button button-dark" onClick={stopCall}>
            End conversation
          </button>
        ) : (
          <button
            className="button button-dark"
            disabled={thinking || playing || !apiUrl}
            onClick={() => void startCall()}
          >
            Start voice conversation
          </button>
        )}
        {calling && pausedForThinking && (
          <button
            className="button button-soft"
            onClick={() => readyToSpeak.current?.()}
          >
            Ready to speak
          </button>
        )}
        {calling && canSendTurn && (
          <button
            className="button button-soft"
            onClick={() => sendTurn.current?.()}
          >
            Send my turn
          </button>
        )}
        {calling && (
          <div
            className="voice-level"
            role="meter"
            aria-label="Conversation microphone level"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={level}
          >
            <i style={{ transform: `scaleX(${level / 100})` }} />
          </div>
        )}
      </div>
      <form
        className="conversation-form"
        onSubmit={(event) => void send(event)}
      >
        <span className="conversation-composer-label">
          Your message or practice idea
        </span>
        <KoreanInput
          disabled={calling}
          multiline
          openOnFocus={false}
          maxLength={600}
          value={draft}
          onChange={(value) => setDraft(value.slice(0, 600))}
          label="Your conversation message"
          placeholder="Say hello, write a reply, or tell your partner what to practice…"
          onKeyDown={(event) => {
            if (
              shouldSendConversationKey(
                event.key,
                event.shiftKey,
                event.nativeEvent.isComposing,
                event.keyCode,
              )
            ) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <div className="conversation-composer-footer">
          <small>Enter to send · Shift+Enter for a new line</small>
          <span>{draft.length}/600</span>
        </div>
        <div className="flashcard-tools">
          <button
            className="button button-dark"
            type="submit"
            disabled={calling || thinking || playing || !draft.trim()}
          >
            Send message
          </button>
          {thinking && !calling && <button type="button" className="button button-quiet" onClick={()=>{request.current?.abort();setNotice("Reply stopped. Your message is still here.");}}>Cancel reply</button>}
          {turns.length > 0 && (
            <button
              type="button"
              className="button button-quiet"
              disabled={thinking || calling || playing}
              onClick={() => {
                stopKoreanPlayback();
                history.current = [];
                setTurns([]);
                setDraft("");
                setNotice("");
              }}
            >
              New conversation
            </button>
          )}
        </div>
      </form>
      {notice && (
        <p role="status" className="tutor-service-message">
          {notice}
        </p>
      )}
    </section>
  );
}
