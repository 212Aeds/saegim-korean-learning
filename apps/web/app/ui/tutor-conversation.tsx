"use client";
import {guidedConversationStep,guidedChoiceMatches} from "./guided-conversation";
import {isUsefulReplySuggestion,isRepeatedConversationLine} from "./reply-suggestion";
import {conversationRequestError} from "./conversation-request-error";
import {recordedAudioEnabled, recordedAudioUrl} from "./recorded-audio";
import {currentVoiceDevicePolicy} from "./voice-device-policy";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { LearningProfile } from "../learning-profile";
import { browserVoicePlaybackElement, browserVoiceState, prepareBrowserVoicesAutomatically, subscribeBrowserVoices, primeBrowserVoicePlayback, enableBrowserVoices } from "./browser-voices";
import {conversationLearning} from "./conversation-learning";
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
  preferredSpeechRate,
  saveSpeechRate,
  saveElevenLabsVoice,
  stopKoreanPlayback,
  prefetchLocalKorean,
  prefetchConversationKorean,
  koreanConversationAudioAvailable,
  usesBrowserConversationVoices,
  type ElevenLabsVoice,
} from "./speech";
import { voiceTiming, thinkingPause } from "./conversation-timing";
import { preferredRecordingPause } from "./recording-preferences";
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
export function TutorConversation({ profile, completedLessonIds=[] }: { profile: LearningProfile; completedLessonIds?:string[] }) {
  const [turns, setTurns] = useState<Turn[]>([]),
    [draft, setDraft] = useState(""),
    [thinking, setThinking] = useState(false),
    [notice, setNotice] = useState(""),
    [voice, setVoice] = useState<ElevenLabsVoice>("jessica"),
    [playing, setPlaying] = useState(false),
    [calling, setCalling] = useState(false),
    [phase, setPhase] = useState(""),
    [level, setLevel] = useState(0);
  const [guided,setGuided]=useState<{starter:number;step:number}|null>(null);
  const guidedStep=guided?guidedConversationStep(profile.level,guided.starter,guided.step):null;
  const learning=conversationLearning(completedLessonIds);
  const [useLessonWords,setUseLessonWords]=useState(true);
  const [audioStatus,setAudioStatus]=useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  const [pace,setPace] = useState(1);
  const [replyIdea,setReplyIdea]=useState<Reply|null>(null),[helping,setHelping]=useState(false),[helpError,setHelpError]=useState("");
  const hintAbort=useRef<AbortController|null>(null);
  const [phraseAdded,setPhraseAdded]=useState(false);
  const [voiceSetup,setVoiceSetup]=useState(browserVoiceState);
  const browserVoices=usesBrowserConversationVoices();
  const deviceVoicePolicy=currentVoiceDevicePolicy();
  const voiceReady=!browserVoices||voiceSetup.phase==="ready";
  useEffect(()=>{const unsubscribe=subscribeBrowserVoices(setVoiceSetup);if(browserVoices)void prepareBrowserVoicesAutomatically().catch(()=>{});return unsubscribe;},[browserVoices]);
  const audioHost=useRef<HTMLDivElement|null>(null);
  const [audioAvailable,setAudioAvailable]=useState(false);
  useEffect(()=>{
    if(!browserVoices||!audioHost.current)return;
    const audio=browserVoicePlaybackElement();
    audio.controls=true;
    audio.setAttribute("aria-label","Conversation audio");
    audio.setAttribute("playsinline","");
    const reveal=()=>setAudioAvailable(audio.src.startsWith("blob:"));
    audio.addEventListener("loadedmetadata",reveal);
    audioHost.current.appendChild(audio);
    return ()=>{audio.removeEventListener("loadedmetadata",reveal);audio.remove();};
  },[browserVoices]);
  const composer=useRef<HTMLFormElement|null>(null);
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
    setPace(preferredSpeechRate());
    return () => {
      mounted.current = false;
      listeningAttempt.current++;
      call.current?.abort();
      request.current?.abort();
      stopKoreanPlayback();
    };
  }, []);
  useEffect(()=>{void prefetchLocalKorean(situation.phrase,voice);setPhraseAdded(false);},[situation.phrase,voice]);
  useEffect(() => {
    log.current?.scrollTo({
      top: log.current.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }, [turns.length, thinking, pendingMessage]);
  function canListen(text: string, partner = voice) {
    return !browserVoices || deviceVoicePolicy.canLoad || Boolean(recordedAudioEnabled && recordedAudioUrl(text,partner));
  }
  async function listen(text: string, partner = voice) {
    if(!canListen(text,partner)){setNotice(deviceVoicePolicy.reason);return;}
    if(browserVoices)primeBrowserVoicePlayback();
    const attempt=++listeningAttempt.current;
    setPlaying(true);
    setNotice("");
    setAudioStatus("Preparing your partner’s voice…");
    try {
      const result = await playElevenLabsKorean(text, partner, pace, {
        naturalOnly: true,
        consistentVoice: true,
        conversationVoice: true,
        waitForEnd: true,
        onPlaybackStart:()=>{if(mounted.current&&attempt===listeningAttempt.current)setAudioStatus("Your partner is speaking…");},
      });
      if (!result.played && mounted.current && attempt===listeningAttempt.current){
        setAudioAvailable(Boolean(result.needsTap));
        setNotice(result.needsTap?"Audio is ready. Tap Play in the audio player, or tap Listen again.":browserVoices&&!deviceVoicePolicy.canLoad?deviceVoicePolicy.reason:browserVoices&&!voiceReady?"Your matching voices are still preparing. You can keep chatting by text.":"Voice playback is unavailable. You can continue by typing.");
      }
    } catch {
      if (mounted.current && attempt===listeningAttempt.current) setNotice("Audio could not start. Try listening again or continue by typing.");
    } finally {
      if (mounted.current && attempt===listeningAttempt.current){setPlaying(false);setAudioStatus("");}
    }
  }
  const latestPartner=[...turns].reverse().find(turn=>turn.role==="assistant");
  const starter=latestPartner?replyIdea?.korean:situation.phrase;
  const starterMeaning=latestPartner?replyIdea?.english:situation.meaning;
  useEffect(()=>{hintAbort.current?.abort();hintAbort.current=null;setHelping(false);setReplyIdea(null);setHelpError("");setPhraseAdded(false);return ()=>hintAbort.current?.abort();},[turns.length,scenario]);
  async function suggestReply(){
    if(!latestPartner||helping||calling||thinking)return;
    if(guidedStep){const option=guidedStep.choices[0];if(option)setReplyIdea({...option,feedback:"An app-authored reply option."});else setHelpError("This guided exchange is complete. Start another topic.");return;}
    if(!apiUrl)return;
    const controller=new AbortController();hintAbort.current=controller;setHelping(true);setHelpError("");
    const timer=window.setTimeout(()=>controller.abort(),65000);
    try{
      const response=await fetch(`${apiUrl}/v1/tutor/conversation`,{method:"POST",credentials:"include",cache:"no-store",signal:controller.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"reply-help",messages:conversationHistory(history.current,"Suggest my ANSWER to the last question, as the learner. Do not repeat or translate the question. Choose a plausible detail (a food, place, time or preference) and give one short Korean statement answering it. No question marks. I will edit the example."),level:profile.level,scenario,consent:true})});
      if(!response.ok)throw Error(response.status===401?"Sign in again to get a reply idea. Your conversation is still here.":response.status===429?"The daily AI allowance has been reached. Your conversation and draft are still here.":"A reply idea could not load. Try again.");
      const idea=await response.json() as Reply;
      if(!isUsefulReplySuggestion(idea,latestPartner.content))throw Error("That suggestion did not answer the question. Try another reply idea, or write your own answer.");
      if(!controller.signal.aborted){setReplyIdea(idea);void prefetchConversationKorean(idea.korean,voice);}
    }catch(error){if(mounted.current&&hintAbort.current===controller)setHelpError(controller.signal.aborted?"The suggestion took too long. Try again.":error instanceof Error?error.message:"A reply idea could not load.");}
    finally{window.clearTimeout(timer);if(hintAbort.current===controller){hintAbort.current=null;if(mounted.current)setHelping(false);}}
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
          practicedWords:useLessonWords?learning.words:[],
          consent: true,
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(conversationRequestError(response.status));
      const reply=(await response.json()) as Reply;
      if (
        !reply || typeof reply !== "object" ||
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
      if(isRepeatedConversationLine(reply.korean,text))throw new Error("Your partner repeated your message instead of replying. Please try again.");
      history.current = [
        ...history.current,
        { role: "user", content: text },
        { role: "assistant", content: reply.korean, reply, partner: voice },
      ];
      void prefetchConversationKorean(reply.korean,voice);
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
  async function toggleReadAloud(enabled:boolean){
    setSpeakReplies(enabled);
    if(!enabled)return;
    setNotice("");
    if(browserVoices&&!guided){
      primeBrowserVoicePlayback();
      try{await enableBrowserVoices();}
      catch{if(mounted.current){setNotice("Read-aloud is on, but voice preparation could not finish. Tap Retry voice preparation.");}}
    }
  }
  async function beginGuided(topic:string,index:number){
    if(request.current||calling)return;
    listeningAttempt.current++;stopKoreanPlayback();setPlaying(false);setAudioAvailable(false);
    const opening=guidedConversationStep(profile.level,index,0);
    setGuided({starter:index,step:0});setDraft("");setNotice("");
    history.current=[{role:"user",content:topic},{role:"assistant",content:opening.reply.korean,reply:opening.reply,partner:voice}];
    setTurns(history.current);void prefetchLocalKorean(opening.reply.korean,voice);
    if(speakReplies)await listen(opening.reply.korean);
  }
  async function sendMessage(message: string) {
    const text = message.trim().replace(/\s+/gu, " ").slice(0, 600);
    if (!text || request.current || calling) return;
    if(playing){listeningAttempt.current++;stopKoreanPlayback();setPlaying(false);setAudioAvailable(false);}
    if(browserVoices&&speakReplies&&!guided){primeBrowserVoicePlayback();void enableBrowserVoices().catch(()=>{});}
    setDraft(text);
    setNotice("");
    if(guided&&guidedStep){
      const choice=guidedStep.choices.find(item=>guidedChoiceMatches(item.korean,item.english,text));
      if(!choice){setNotice(guidedStep.choices.length?"Guided practice uses the example replies below. Choose one, or switch to AI to write freely.":"This guided exchange is complete. Start a new conversation or switch to AI.");return;}
      const next=guidedConversationStep(profile.level,guided.starter,guided.step+1);
      history.current=[...history.current,{role:"user",content:choice.korean},{role:"assistant",content:next.reply.korean,reply:next.reply,partner:voice}];
      setTurns(history.current);setGuided({...guided,step:guided.step+1});setDraft("");
      if(speakReplies)await listen(next.reply.korean);return;
    }
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
    if(browserVoices)primeBrowserVoicePlayback();
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
    const useVoiceReplies=!browserVoices||deviceVoicePolicy.canLoad;
    try {
      setPhase("Getting Korean audio ready…");
      if(browserVoices&&useVoiceReplies)await enableBrowserVoices();
      if (useVoiceReplies&&!(await koreanConversationAudioAvailable()))
        throw new Error("Audio could not prepare. Try again, or keep chatting by text.");
      if (controller.signal.aborted) return;
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
          setPhase("Adjusting microphone · wait a moment");
          wav = await recordConversationTurn(
            controller.signal,
            (value) => {
              if (!controller.signal.aborted) setLevel(value);
            },
            {
              silenceMs: preferredRecordingPause(voiceTiming(profile.level).silenceMs),
              maxSeconds: 30,
              onReady: (finish) => {
                sendTurn.current = finish;
                if (!controller.signal.aborted) {setCanSendTurn(!!finish);if(finish)setPhase("Listening · speak, then pause");}
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
                AbortSignal.timeout(65000),
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
        setPhase("Preparing your partner’s voice…");
        const playback = useVoiceReplies ? await playElevenLabsKorean(reply.korean, voice, pace, {
          naturalOnly: true,
          consistentVoice: true,
          conversationVoice: true,
          waitForEnd: true,
          onPlaybackStart:()=>{if(!controller.signal.aborted)setPhase(`${voice === "chris" ? "Chris" : "Jessica"} is speaking…`);},
        }) : {played:true};
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
      {browserVoices&&voiceSetup.phase==="loading"&&<p role="status">Preparing audio…</p>}
      {browserVoices&&voiceSetup.phase==="error"&&<button type="button" className="button button-quiet" onClick={()=>void enableBrowserVoices().catch(()=>{})}>Retry audio</button>}
      <div className="listening-controls">
        <label><span>Conversation pace <strong>{pace.toFixed(2)}×</strong></span><input aria-label="Conversation pace" type="range" min="0.65" max="1.4" step="0.05" value={pace} disabled={playing || calling} onChange={event=>{const value=Number(event.target.value);setPace(value);saveSpeechRate(value);}} /><small>A natural conversation rhythm. Slow it down whenever you need.</small></label>
        <button type="button" role="switch" aria-checked={speakReplies} className="button button-soft read-aloud-switch" onClick={()=>void toggleReadAloud(!speakReplies)}>Read chat replies aloud · {speakReplies?"On":"Off"}</button><small>Reads new replies after you send a message. Use Listen beside an earlier reply to replay it.</small>
        {browserVoices&&<div className="conversation-audio-player" ref={audioHost} hidden={!audioAvailable}><small>If automatic playback is blocked, use Play here after the voice is ready.</small></div>}
        {notice && <p role="status">{notice}</p>}
        {playing && <p role="status">{audioStatus}</p>}
        {playing && <button type="button" className="button button-quiet" onClick={()=>{listeningAttempt.current++;stopKoreanPlayback();setPlaying(false);setAudioAvailable(false);}}>Stop audio</button>}
      </div>
      {learning.words.length>0&&<details className="conversation-learning"><summary>Practice words from your lessons</summary><p>{learning.titles.join(" · ")}</p><p lang="ko">{learning.words.join(" · ")}</p><label><input type="checkbox" checked={useLessonWords} disabled={calling||thinking||playing} onChange={e=>setUseLessonWords(e.target.checked)}/> Ask your partner to reuse these words</label><small>Completed lessons show exposure, not mastery. AI may introduce a new word or make a mistake.</small></details>}
      <section className="conversation-guide" aria-label="Conversation practice for your level">
        <div><span className="micro-label">YOUR CURRENT STARTING POINT</span><h3>{guide.title}</h3><p>{guide.detail}</p></div>
        <p className="conversation-goal"><strong>Try this today</strong>{guide.goal}</p>
        <details className="conversation-scenario-browser"><summary>Practice situation: {situation.title}</summary><div className="conversation-situations" role="group" aria-label="Choose a practice situation">
          {conversationSituations.map((item) => <button type="button" key={item.id} aria-pressed={scenario === item.id} disabled={calling || thinking || playing} onClick={() => { history.current=[];setTurns([]);setGuided(null);setNotice("");setScenario(item.id);setDraft(item.prompt); }}>{item.title}</button>)}
        </div></details>
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
            <p>Choose a situation to start an AI conversation, or type your own topic below.</p>
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
            <details><summary>Prefer guided practice without AI?</summary><p>App-authored exchanges with example replies.</p><div className="flashcard-tools">{guide.starters.map((topic,index)=><button type="button" className="button button-quiet" key={topic} disabled={calling||thinking} onClick={()=>void beginGuided(topic,index)}>Guided: {topic}</button>)}</div></details>
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
                    {canListen(turn.content,turn.partner)?playing?"Preparing / speaking…":"▶ Listen":"Audio unavailable on this device"}
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
      {guided&&guidedStep&&<section className="conversation-help guided-conversation" aria-label="Guided conversation replies">
        <strong>Guided practice · no AI requests</strong>
        <p>{guidedStep.reply.feedback}</p>
        <div className="flashcard-tools">{guidedStep.choices.map(choice=><button type="button" className="button button-soft" key={choice.korean} disabled={calling||thinking} onClick={()=>void sendMessage(choice.korean)}><span lang="ko">{choice.korean}</span> · {choice.english}</button>)}</div>
        {guidedStep.choices.length>0&&<details><summary>Reply meanings and references</summary>{guidedStep.choices.map(choice=><div key={choice.korean}><p lang="ko">{choice.korean}</p><p>{transcriptRomanization(choice.korean)} · {choice.english}</p><WordReference word={choice.korean}/></div>)}</details>}
        <button type="button" className="button button-quiet" disabled={calling||thinking} onClick={()=>{setGuided(null);setNotice("AI conversation selected. Type your own reply below; the free AI allowance applies.");}}>Use AI for open-ended chat</button>
      </section>}
      {turns.some(turn=>turn.role==="assistant")&&!guided&&<div className="conversation-help" aria-label="Conversation help"><button type="button" className="button button-quiet" disabled={calling||thinking||playing||!!draft.trim()} onClick={()=>void sendMessage("Please say your last reply in simpler Korean, with one short question.")}>Simpler Korean</button><button type="button" className="button button-quiet" disabled={calling||thinking||playing||!!draft.trim()} onClick={()=>void sendMessage("Help me answer your last question. Give one short Korean example and its meaning in the learning tip.")}>Help me answer</button><small>These ask your tutor for another reply and use the usual free allowance. Clear your draft first to use them. Use Listen beside a reply to hear it again.</small></div>}
      <details className="conversation-phrase-help">
        <summary>Need a phrase to get started?</summary>
        {latestPartner&&<><p>Get an editable example for your partner’s latest question.</p><button type="button" className="button button-soft" disabled={helping||calling||thinking} onClick={()=>void suggestReply()}>{helping?"Finding a reply idea…":replyIdea?"Try another reply idea":"Suggest a reply to this question"}</button><small>{guided?"Guided examples use no AI requests. Choose an example below or switch to AI to write freely.":"Uses the usual free tutor allowance. Edit the example to match what you mean."}</small></>}
        {helpError&&<p role="status">{helpError}</p>}
        {starter&&<><p lang="ko">{starter}</p><p className="conversation-roman">{transcriptRomanization(starter)}</p><p>{starterMeaning}</p>
        <div className="flashcard-tools"><button type="button" className="button button-soft" disabled={calling||thinking} aria-pressed={phraseAdded} onClick={()=>{setDraft(starter);setPhraseAdded(true);requestAnimationFrame(()=>{composer.current?.scrollIntoView({block:"center",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});composer.current?.querySelector("textarea")?.focus({preventScroll:true});});}}>{phraseAdded?"Phrase added ↓":"Use this phrase"}</button><button type="button" className="button button-quiet" disabled={calling||thinking||playing} onClick={()=>void listen(starter)}>{playing?"Preparing / speaking…":"Listen"}</button></div><WordReference word={starter}/></>}
      </details>
      <div className={`voice-conversation-panel ${calling ? "is-active" : ""}`}>
        <div>
          <strong>
            {calling ? "You’re in a voice conversation" : "Talk one on one"}
          </strong>
          <p>
            {calling
              ? phase
              : "Speak your reply; the transcript and your partner’s answer appear above. When matching voices are available, your partner speaks too. A short pause sends your speech. After the reply, you get time to think; tap Ready to speak to begin sooner."}
          </p>
        </div>
        {calling ? (
          <button className="button button-dark" onClick={stopCall}>
            End conversation
          </button>
        ) : (
          <button
            className="button button-dark"
            disabled={thinking || playing || !apiUrl || !!guided}
            onClick={() => void startCall()}
          >
            {guided?"Switch to AI mode for voice conversation":deviceVoicePolicy.canLoad?"Start voice conversation":"Start speak-and-read conversation"}
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
        ref={composer}
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
          onChange={(value) => {setDraft(value.slice(0, 600));setPhraseAdded(false);}}
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
                setGuided(null);
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
