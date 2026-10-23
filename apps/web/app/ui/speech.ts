import {conversationSpeechParts} from "./conversation-speech-parts";
import { cachedBrowserVoice, enableBrowserVoices, browserVoiceState, synthesizeBrowserVoice, primeBrowserVoicePlayback, browserVoicePlaybackElement } from "./browser-voices";
import { recordedAudioEnabled, recordedAudioUrl } from "./recorded-audio";
import { paidFeaturesEnabled, hostedAiEnabled } from "../release";
import { localSpeechUrl } from "./local-speech-server";
import { naturalSpeechText, consonantName } from "./hangul-answers";
export type KoreanSpeechOptions = {
  voiceId?: string;
  voiceURI?: string;
  voiceName?: string;
  rate?: number;
  naturalOnly?: boolean;
  consistentVoice?: boolean;
  conversationVoice?: boolean;
  waitForEnd?: boolean;
  onPlaybackStart?: () => void;
};
export type ElevenLabsVoice = "jessica" | "chris";
const elevenLabsVoiceStorageKey = "sori-elevenlabs-voice";

export function selectedElevenLabsVoice(): ElevenLabsVoice {
  if (typeof window === "undefined") return "jessica";
  return window.localStorage.getItem(elevenLabsVoiceStorageKey) === "chris"
    ? "chris"
    : "jessica";
}

export function saveElevenLabsVoice(voice: ElevenLabsVoice) {
  if (typeof window !== "undefined")
    window.localStorage.setItem(elevenLabsVoiceStorageKey, voice);
}

export function saveSpeechRate(rate: number) {
  if (typeof window !== "undefined" && Number.isFinite(rate)) {
    window.localStorage.setItem(
      "sori-speech-rate",
      String(Math.min(1.4, Math.max(0.65, rate))),
    );
  }
}

export function preferredSpeechRate() {
  if (typeof window === "undefined") return 1;
  const saved = Number(window.localStorage.getItem("sori-speech-rate"));
  return saved >= 0.65 && saved <= 1.4 ? saved : 1;
}

let queuedStart: number | undefined;

export function listKoreanVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window))
    return [];
  const korean = window.speechSynthesis
    .getVoices()
    .filter(
      (voice) =>
        voice.lang.toLowerCase().startsWith("ko") && (voice.localService || hostedAiEnabled),
    );
  const unique = new Map<string, SpeechSynthesisVoice>();
  for (const voice of korean) {
    const key = `${voice.name.trim().toLocaleLowerCase()}|${voice.lang.toLocaleLowerCase()}`;
    const current = unique.get(key);
    if (!current || voicePriority(voice) < voicePriority(current))
      unique.set(key, voice);
  }
  const choices = [...unique.values()].sort(
    (left, right) =>
      voicePriority(left) - voicePriority(right) ||
      left.name.localeCompare(right.name),
  );
  return choices.slice(0, 4);
}

function voicePriority(voice: SpeechSynthesisVoice) {
  const name = voice.name.toLowerCase();
  if (!voice.localService) return 5;
  const enhanced = /natural|neural|enhanced|premium/i.test(
    `${voice.name} ${voice.voiceURI}`,
  )
    ? -1
    : 0;
  if (/yuna/.test(name)) return enhanced;
  if (/eddy/.test(name)) return 1 + enhanced;
  if (
    /natural|neural|enhanced|premium/i.test(`${voice.name} ${voice.voiceURI}`)
  )
    return 2;
  return 3;
}

function selectedKoreanVoice(
  voices: SpeechSynthesisVoice[],
  options: KoreanSpeechOptions,
) {
  const selectedURI = voices.find((voice) => voice.voiceURI === options.voiceURI);
  if (selectedURI) return selectedURI;
  const namedVoice = options.voiceName
    ? voices.find((voice) => voice.name === options.voiceName)
    : undefined;
  if (namedVoice) return namedVoice;
  if (options.voiceName === "Yuna") return voices[0] ?? null;
  return (
    voices.find((voice) => voice.voiceURI === options.voiceURI) ??
    voices[0] ??
    null
  );
}

async function waitForKoreanVoices(
  timeoutMs = 1_500,
): Promise<SpeechSynthesisVoice[]> {
  const current = listKoreanVoices();
  if (
    current.length ||
    typeof window === "undefined" ||
    !window.speechSynthesis
  )
    return current;
  return new Promise((resolve) => {
    const speech = window.speechSynthesis;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (timer !== undefined) window.clearTimeout(timer);
      speech.removeEventListener("voiceschanged", finish);
      resolve(listKoreanVoices());
    };
    const timer = window.setTimeout(finish, timeoutMs);
    speech.addEventListener("voiceschanged", finish, { once: true });
    speech.getVoices();
  });
}

export function usesBrowserConversationVoices(){return hostedAiEnabled && !localSpeechUrl && !paidFeaturesEnabled;}

export async function koreanConversationAudioAvailable() {
  if (typeof window === "undefined") return false;
  if (localSpeechUrl || (paidFeaturesEnabled && apiUrl)) return true;
  if(usesBrowserConversationVoices())return browserVoiceState().phase === "ready";
  return (await waitForKoreanVoices()).length > 0;
}

function playDeviceKorean(text: string, options: KoreanSpeechOptions = {}, finished?: (success: boolean) => void) {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    !("SpeechSynthesisUtterance" in window)
  )
    return false;

  const voices = listKoreanVoices();
  const savedRate = Number(window.localStorage.getItem("sori-speech-rate"));
  const savedURI =
    window.localStorage.getItem("sori-korean-voice-uri") ?? undefined;
  const playbackOptions = {
    ...options,
    voiceName: options.voiceName ?? "Yuna",
    voiceURI: options.voiceName
      ? options.voiceURI
      : (options.voiceURI ?? savedURI),
    rate:
      options.rate ??
      (savedRate >= 0.65 && savedRate <= 1.4 ? savedRate : undefined),
  };
  const voice = selectedKoreanVoice(voices, playbackOptions);
  // Never let the browser fall back to an English voice for Korean text.
  if (!voice) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice.lang.toLowerCase().startsWith("ko")
    ? voice.lang
    : "ko-KR";
  utterance.rate = Math.min(1.4, Math.max(0.65, playbackOptions.rate ?? 1));
  utterance.pitch = 1;
  utterance.voice = voice;
  utterance.onend = () => finished?.(true);
  utterance.onerror = () => finished?.(false);
  window.speechSynthesis.cancel();
  if (queuedStart !== undefined) window.clearTimeout(queuedStart);
  queuedStart = window.setTimeout(() => {
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      finished?.(false);
      // Some browsers expose the API but cannot start a local speech engine.
    }
    queuedStart = undefined;
  }, 40);
  return true;
}

function playDeviceUntilEnd(text: string, options: KoreanSpeechOptions): Promise<boolean> {
  return new Promise(resolve => {
    let timer: number | undefined;
    let settled = false;
    const finish = (success: boolean) => {
      if (settled) return;
      settled = true;
      if (timer !== undefined) window.clearTimeout(timer);
      if (settlePlayback === finish) settlePlayback = undefined;
      resolve(success);
    };
    if (options.waitForEnd) settlePlayback = finish;
    const started = playDeviceKorean(text, options, finish);
    if (!started || !options.waitForEnd) finish(started);
    else timer = window.setTimeout(() => { window.speechSynthesis.cancel(); finish(false); }, 120_000);
  });
}

export function speakKorean(text: string, options: KoreanSpeechOptions = {}) {
  if (typeof window === "undefined") return false;
  void playElevenLabsKorean(
    text,
    selectedElevenLabsVoice(),
    options.rate ?? preferredSpeechRate(),
    options,
  );
  return true;
}

export function previewKoreanVoice(
  text: string,
  voiceURI: string,
  rate: number,
): boolean {
  stopKoreanPlayback();
  return playDeviceKorean(text, { voiceURI, rate });
}

export type CatalogVoice = {
  id: string;
  label: string;
  locale: "ko-KR";
  sampleAssetId: string;
};
export type KoreanPlayback = {
  played: boolean;
  needsTap?: boolean;
  source: "catalog" | "elevenlabs" | "local" | "device" | "browser-model" | "unavailable";
};
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
let activeAudio: HTMLAudioElement | undefined;
let activeUrl: string | undefined;
let pendingAudio: AbortController | undefined;
let playbackVersion = 0;
let settlePlayback: ((ended: boolean) => void) | undefined;
const localAudioCache = new Map<string, Blob>();
const localAudioPreparing = new Map<string, Promise<Blob>>();
function normalizedSpeech(text: string) {
  return naturalSpeechText(text).normalize("NFC").trim().replace(/\s+/gu, " ");
}
async function localAudio(text: string, voice: ElevenLabsVoice): Promise<Blob> {
  const clean = normalizedSpeech(text), key = `${voice}|${clean}`;
  const cached = localAudioCache.get(key);
  if (cached) return cached;
  const preparing = localAudioPreparing.get(key);
  if (preparing) return preparing;
  const task = (async () => {
    const recorded = recordedAudioEnabled ? recordedAudioUrl(text,voice) : undefined;
    const response = recorded ? await fetch(recorded,{cache:"force-cache",signal:AbortSignal.timeout(20_000)}) : await fetch(`${localSpeechUrl}/v1/speech/synthesize`, {
      method: "POST", credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(180_000),
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({text: clean, voice}),
    });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("audio/")) throw new Error("Local audio unavailable");
    const blob = await response.blob();
    if (!blob.size || blob.size > 5 * 1024 * 1024) throw new Error("Invalid audio");
    localAudioCache.set(key, blob);
    while (localAudioCache.size > 24 || [...localAudioCache.values()].reduce((size, value) => size + value.size, 0) > 8 * 1024 * 1024) {
      localAudioCache.delete(localAudioCache.keys().next().value!);
    }
    return blob;
  })();
  localAudioPreparing.set(key, task);
  try { return await task; } finally { localAudioPreparing.delete(key); }
}
// Prepare only explicitly configured local audio; never warm a paid provider.
let preparationVersion = 0;
export async function prefetchLocalKorean(text: string, voice = selectedElevenLabsVoice()) {
  if ((!localSpeechUrl && !(recordedAudioEnabled && recordedAudioUrl(text,voice))) || typeof window === "undefined") return;
  const version = ++preparationVersion;
  // Rapid navigation keeps only the latest background preparation.
  // An explicit Listen request still shares its in-flight clip immediately.
  // Recorded files are independent downloads; a stalled old clip must not hold the next card.
  if (!recordedAudioEnabled || !recordedAudioUrl(text,voice)) await Promise.allSettled([...localAudioPreparing.values()]);
  if (version !== preparationVersion) return;
  try { await localAudio(text, voice); } catch { /* The Listen button can retry. */ }
}

// Prepare only a visible conversation line with an already initialized model.
// Listen shares the same in-flight synthesis; this never starts model setup or a paid call.
export async function prefetchConversationKorean(text: string, voice: ElevenLabsVoice) {
  if (recordedAudioEnabled && recordedAudioUrl(text,voice) || localSpeechUrl) return prefetchLocalKorean(text,voice);
  if (!usesBrowserConversationVoices() || browserVoiceState().phase !== "ready") return;
  try { await synthesizeBrowserVoice(naturalSpeechText(conversationSpeechParts(text)[0]??text),voice,new AbortController().signal); }
  catch { /* Explicit Listen can retry after preparation fails. */ }
}

export async function playConversationKorean(text:string,voice:ElevenLabsVoice,rate=1,options:KoreanSpeechOptions={}):Promise<KoreanPlayback>{
  const parts=usesBrowserConversationVoices()&&!(recordedAudioEnabled&&recordedAudioUrl(text,voice))&&!localSpeechUrl?conversationSpeechParts(text):[text];
  let last:KoreanPlayback={played:false,source:"unavailable"};
  for(let index=0;index<parts.length;index++){
    const playback=playElevenLabsKorean(parts[index],voice,rate,{...options,waitForEnd:true,onPlaybackStart:()=>{
      options.onPlaybackStart?.();
      if(index+1<parts.length)void prefetchConversationKorean(parts[index+1],voice);
    }});
    const version=playbackVersion;
    last=await playback;
    if(!last.played||version!==playbackVersion)return {...last,played:false};
  }
  return last;
}
export async function playElevenLabsKorean(
  text: string,
  voice: ElevenLabsVoice = selectedElevenLabsVoice(),
  rate = 1,
  fallbackOptions: KoreanSpeechOptions = {},
): Promise<KoreanPlayback> {
  if (typeof window === "undefined")
    return { played: false, source: "unavailable" };
  fallbackOptions = {...fallbackOptions, consistentVoice:true, naturalOnly:true};
  stopKoreanPlayback();
  const version = playbackVersion;
  const recorded = recordedAudioEnabled ? recordedAudioUrl(text,voice) : undefined;
  const browserVoice=usesBrowserConversationVoices() && !recorded;
  if(browserVoice)primeBrowserVoicePlayback();
  if(browserVoice && browserVoiceState().phase!=="ready"){
    try{await enableBrowserVoices();}catch{return {played:false,source:"unavailable"};}
    if(version!==playbackVersion)return {played:false,source:"unavailable"};
  }
  if (!paidFeaturesEnabled && !localSpeechUrl && !recorded && !browserVoice) {
    if(fallbackOptions.consistentVoice)return {played:false,source:"unavailable"};
    await waitForKoreanVoices();
    if (version !== playbackVersion) return {played:false,source:"unavailable"};
    const played=await playDeviceUntilEnd(naturalSpeechText(text), {...fallbackOptions,rate});
    return {played,source:played ? "device" : "unavailable"};
  }
  const controller = new AbortController();
  pendingAudio = controller;
  const timeout = window.setTimeout(() => controller.abort(), localSpeechUrl ? 180_000 : browserVoice ? 120_000 : 20_000);
  try {
    if (!localSpeechUrl && !apiUrl && !recorded && !browserVoice) throw new Error();
    const response = localSpeechUrl || recorded || browserVoice ? null : await fetch(`${apiUrl}/v1/speech/synthesize`, {
      method: "POST",
      credentials: localSpeechUrl ? "omit" : "include",
      cache: "no-store",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: naturalSpeechText(text)
          .normalize("NFC")
          .trim()
          .replace(/\s+/gu, " "),
        voice,
      }),
    });
    if (
      response && (!response.ok ||
      !response.headers.get("content-type")?.toLowerCase().startsWith("audio/"))
    )
      throw new Error();
    // A packaged clip has a public URL already. Start it directly inside the
    // tap gesture so mobile autoplay rules do not reject an awaited fetch.
    const blob = recorded ? undefined : browserVoice ? cachedBrowserVoice(naturalSpeechText(text),voice) ?? await synthesizeBrowserVoice(naturalSpeechText(text),voice,controller.signal) : localSpeechUrl ? await localAudio(text, voice) : await response!.blob();
    if (
      version !== playbackVersion ||
      controller.signal.aborted ||
      (blob && (!blob.size || blob.size > 5 * 1024 * 1024))
    ) {
      throw new Error();
    }
    const url = recorded ?? URL.createObjectURL(blob!);
    const audio = browserVoice ? browserVoicePlaybackElement() : new Audio(url);
    if(browserVoice)audio.src=url;
    audio.preload = "auto";
    activeUrl = recorded ? undefined : url;
    activeAudio = audio;
    audio.playbackRate = Math.min(1.4, Math.max(0.65, rate));
    const release = (keepForReplay=false) => {
      if(keepForReplay)return;
      if (!recorded) URL.revokeObjectURL(url);
      if (activeAudio === audio) {
        activeAudio = undefined;
        activeUrl = undefined;
      }
    };
    let completionTimer: number | undefined;
    const ended = new Promise<boolean>((resolve) => {
      const finish = (success: boolean) => {
        window.clearTimeout(completionTimer);
        if (settlePlayback === finish) settlePlayback = undefined;
        release(success&&browserVoice);
        resolve(success);
      };
      if (fallbackOptions.waitForEnd) {
        settlePlayback = finish;
        completionTimer = window.setTimeout(() => {
          audio.pause();
          finish(false);
        }, 120_000);
      }
      audio.onended = () => finish(true);
      audio.onerror = () => { controller.abort(); finish(false); };
    });
    // Some mobile browsers leave play() pending when loading is interrupted.
    // Cancellation must release the caller even if that promise never settles.
    await new Promise<void>((resolve, reject) => {
      const abort = () => { cleanup(); reject(new DOMException("Playback stopped", "AbortError")); };
      const cleanup = () => controller.signal.removeEventListener("abort", abort);
      controller.signal.addEventListener("abort", abort, { once: true });
      if (controller.signal.aborted) { abort(); return; }
      try {
        audio.play().then(() => { cleanup(); resolve(); }, error => { cleanup(); reject(error); });
      } catch (error) { cleanup(); reject(error); }
    });
    if(!controller.signal.aborted && version===playbackVersion)fallbackOptions.onPlaybackStart?.();
    window.clearTimeout(timeout);
    if (controller.signal.aborted || version !== playbackVersion) {
      audio.pause();
      release();
      throw new Error();
    }
    if (fallbackOptions.waitForEnd && !(await ended))
      return { played: false, source: "unavailable" };
    return { played: true, source: recorded ? "catalog" : browserVoice ? "browser-model" : localSpeechUrl ? "local" : "elevenlabs" };
  } catch (error) {
    if (version !== playbackVersion)
      return { played: false, source: "unavailable" };
    // Keep the prepared source alive for the visible native Play control.
    // Safari can require a direct tap after asynchronous synthesis.
    if(browserVoice && error instanceof Error && error.name==="NotAllowedError")
      return {played:false,source:"unavailable",needsTap:true};
    settlePlayback?.(false);
    activeAudio?.pause();
    if (activeUrl) URL.revokeObjectURL(activeUrl);
    activeAudio = undefined;
    activeUrl = undefined;
    if (fallbackOptions.consistentVoice || fallbackOptions.naturalOnly || consonantName(text.trim()))
      return { played: false, source: "unavailable" };
    await waitForKoreanVoices();
    if (version !== playbackVersion)
      return { played: false, source: "unavailable" };
    const played = await playDeviceUntilEnd(text, {
      ...fallbackOptions,
      voiceName: "Yuna",
      rate,
    });
    return { played, source: played ? "device" : "unavailable" };
  } finally {
    window.clearTimeout(timeout);
    if (pendingAudio === controller) pendingAudio = undefined;
  }
}

export function stopKoreanPlayback() {
  activeAudio?.pause();
  settlePlayback?.(false);
  settlePlayback = undefined;
  playbackVersion += 1;
  pendingAudio?.abort();
  pendingAudio = undefined;
  activeAudio = undefined;
  if (activeUrl) URL.revokeObjectURL(activeUrl);
  activeUrl = undefined;
  if (typeof window !== "undefined") {
    window.speechSynthesis?.cancel();
    if (queuedStart !== undefined) window.clearTimeout(queuedStart);
    queuedStart = undefined;
  }
}

export async function listCatalogVoices(): Promise<CatalogVoice[]> {
  if (!apiUrl) return [];
  try {
    const response = await fetch(`${apiUrl}/v1/audio/voices`, {
      credentials: "include",
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data: unknown = await response.json();
    if (!Array.isArray(data) || data.length > 4) return [];
    return data.filter(
      (voice): voice is CatalogVoice =>
        voice &&
        typeof voice.id === "string" &&
        /^[a-z0-9][a-z0-9-]{0,63}$/.test(voice.id) &&
        !voice.id.includes("candidate") &&
        typeof voice.label === "string" &&
        voice.locale === "ko-KR" &&
        typeof voice.sampleAssetId === "string",
    );
  } catch {
    return [];
  }
}

async function playCachedAsset(
  assetId: string,
  rate: number,
  signal: AbortSignal,
) {
  if (!/^[a-f0-9-]{36}$/i.test(assetId)) throw new Error();
  const response = await fetch(
    `${apiUrl}/v1/audio/${encodeURIComponent(assetId)}`,
    {
      credentials: "include",
      signal,
      cache: "no-store",
    },
  );
  if (
    !response.ok ||
    !response.headers.get("content-type")?.startsWith("audio/")
  )
    throw new Error();
  const blob = await response.blob();
  if (signal.aborted || blob.size > 5 * 1024 * 1024 || !blob.size)
    throw new Error();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  activeUrl = url;
  activeAudio = audio;
  audio.playbackRate = Math.min(1.4, Math.max(0.65, rate));
  const release = () => {
    URL.revokeObjectURL(url);
    if (activeAudio === audio) {
      activeAudio = undefined;
      activeUrl = undefined;
    }
  };
  audio.onended = release;
  audio.onerror = release;
  try {
    await audio.play();
  } catch {
    release();
    throw new Error();
  }
  if (signal.aborted) {
    audio.pause();
    release();
    throw new Error();
  }
}

export async function playKorean(
  text: string,
  options: KoreanSpeechOptions = {},
): Promise<KoreanPlayback> {
  if (typeof window === "undefined")
    return { played: false, source: "unavailable" };
  if (localSpeechUrl || (recordedAudioEnabled && recordedAudioUrl(text,selectedElevenLabsVoice()))) return playElevenLabsKorean(text, selectedElevenLabsVoice(), options.rate ?? preferredSpeechRate(), options);
  stopKoreanPlayback();
  if (!paidFeaturesEnabled) {
    await waitForKoreanVoices();
    const played=await playDeviceUntilEnd(naturalSpeechText(text), options);
    return {played,source:played ? "device" : "unavailable"};
  }
  const version = playbackVersion;
  const voiceId =
    options.voiceId ??
    window.localStorage.getItem("sori-catalog-voice-id") ??
    "";
  if (voiceId && apiUrl) {
    const controller = new AbortController();
    pendingAudio = controller;
    const timeout = window.setTimeout(() => controller.abort(), 8_000);
    try {
      const normalized = text.normalize("NFC").trim().replace(/\s+/g, " ");
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(normalized),
      );
      const contentKey = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      const response = await fetch(
        `${apiUrl}/v1/audio/lookup?${new URLSearchParams({ contentKey, voiceId })}`,
        {
          credentials: "include",
          signal: controller.signal,
          cache: "no-store",
        },
      );
      if (!response.ok) throw new Error();
      const { assetId } = await response.json();
      await playCachedAsset(
        assetId,
        options.rate ?? preferredSpeechRate(),
        controller.signal,
      );
      return { played: true, source: "catalog" };
    } catch {
      if (version !== playbackVersion)
        return { played: false, source: "unavailable" };
    } finally {
      window.clearTimeout(timeout);
      if (pendingAudio === controller) pendingAudio = undefined;
    }
  }
  return playElevenLabsKorean(
    text,
    selectedElevenLabsVoice(),
    options.rate ?? preferredSpeechRate(),
    options,
  );
}

export async function previewCatalogVoice(
  voice: CatalogVoice,
  rate: number,
): Promise<KoreanPlayback> {
  stopKoreanPlayback();
  if (!paidFeaturesEnabled) return {played:false,source:"unavailable"};
  const version = playbackVersion;
  const controller = new AbortController();
  pendingAudio = controller;
  const timeout = window.setTimeout(() => controller.abort(), 8_000);
  try {
    await playCachedAsset(voice.sampleAssetId, rate, controller.signal);
    return { played: true, source: "catalog" };
  } catch {
    return { played: false, source: "unavailable" };
  } finally {
    window.clearTimeout(timeout);
    if (version === playbackVersion) pendingAudio = undefined;
  }
}
