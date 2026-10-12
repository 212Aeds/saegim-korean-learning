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
import { recordConversationTurn } from "./conversation-recording";
type Reply = { korean: string; english: string; feedback: string };
type Turn = ConversationTurn & { reply?: Reply; partner?: ElevenLabsVoice };
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
    setPhase("");
    setLevel(0);
  }
  useEffect(() => {
    mounted.current = true;
    setVoice(selectedElevenLabsVoice());
    return () => {
      mounted.current = false;
      call.current?.abort();
      request.current?.abort();
      stopKoreanPlayback();
    };
  }, []);
  useEffect(() => {
    log.current?.scrollTo({
      top: log.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns.length, thinking]);
  async function listen(text: string, partner = voice) {
    setPlaying(true);
    try {
      const result = await playElevenLabsKorean(text, partner, 1, {
        naturalOnly: true,
        waitForEnd: true,
      });
      if (!result.played && mounted.current)
        setNotice("Voice playback is unavailable. You can continue by typing.");
    } finally {
      if (mounted.current) setPlaying(false);
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
    const timer = window.setTimeout(abort, 65000);
    setThinking(true);
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
        if (mounted.current) setThinking(false);
      }
    }
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim().replace(/\s+/gu, " ").slice(0, 600);
    if (!text || request.current || calling) return;
    setNotice("");
    try {
      await replyTo(text);
      setDraft((current) => (current === draft ? "" : current));
    } catch (error) {
      if (mounted.current)
        setNotice(
          error instanceof Error
            ? error.message
            : "Could not send your message.",
        );
    }
  }
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
          wav = await recordConversationTurn(controller.signal, (value) => {
            if (!controller.signal.aborted) setLevel(value);
          });
          setPhase("Transcribing your message…");
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
          new Uint8Array(wav).fill(0);
          wav = undefined;
          if (!response.ok)
            throw new Error(
              "Your speech could not be transcribed. The conversation is paused.",
            );
          const result = await response.json();
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
        const playback = await playElevenLabsKorean(reply.korean, voice, 1, {
          naturalOnly: true,
          waitForEnd: true,
        });
        if (!playback.played && !controller.signal.aborted)
          throw new Error(
            "Voice playback could not finish. Continue by typing, or try the conversation again.",
          );
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
      <div
        ref={log}
        className="conversation-log"
        role="log"
        aria-label="Your Korean conversation"
        aria-live="polite"
        aria-relevant="additions"
      >
        {!turns.length && (
          <div className="conversation-empty">
            <PartnerAvatar voice={voice} />
            <strong>What would you like to talk about?</strong>
            <p>Start in Korean or describe a situation in English.</p>
            <div className="conversation-starters">
              {[
                "Help me order a drink at a café.",
                "Let’s introduce ourselves in simple Korean.",
                "Ask me about my day.",
              ].map((topic) => (
                <button
                  key={topic}
                  className="button button-soft"
                  disabled={calling}
                  onClick={() => setDraft(topic)}
                >
                  {topic}
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
        {thinking && (
          <p className="conversation-thinking" role="status">
            <span className="typing-dots" aria-hidden="true">
              ● ● ●
            </span>{" "}
            Your partner is replying…
          </p>
        )}
      </div>
      <div className={`voice-conversation-panel ${calling ? "is-active" : ""}`}>
        <div>
          <strong>
            {calling ? "You’re in a voice conversation" : "Talk one on one"}
          </strong>
          <p>
            {calling
              ? phase
              : "Your partner speaks, then listens to your reply. A short pause sends your speech automatically."}
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
            disabled={calling || thinking || !draft.trim()}
          >
            Send message
          </button>
          {turns.length > 0 && (
            <button
              type="button"
              className="button button-quiet"
              disabled={thinking || calling}
              onClick={() => {
                stopKoreanPlayback();
                history.current = [];
                setTurns([]);
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
      <small>
        AI dialogue can contain mistakes. Voice turns send microphone clips to
        generate replies; this chat stays in this visit. Microphone recording
        pauses while your partner speaks. Each voice session pauses after 10
        exchanges or 10 minutes.
      </small>
    </section>
  );
}
