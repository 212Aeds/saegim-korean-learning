import { paidFeaturesEnabled } from "../release";
import { naturalSpeechText, consonantName } from "./hangul-answers";
export type KoreanSpeechOptions = {
  voiceId?: string;
  voiceURI?: string;
  voiceName?: string;
  rate?: number;
  naturalOnly?: boolean;
  waitForEnd?: boolean;
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
      String(Math.min(1.1, Math.max(0.65, rate))),
    );
  }
}

function preferredSpeechRate() {
  if (typeof window === "undefined") return 1;
  const saved = Number(window.localStorage.getItem("sori-speech-rate"));
  return saved >= 0.65 && saved <= 1.1 ? saved : 1;
}

let queuedStart: number | undefined;

export function listKoreanVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window))
    return [];
  const korean = window.speechSynthesis
    .getVoices()
    .filter(
      (voice) =>
        voice.lang.toLowerCase().startsWith("ko") && voice.localService,
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
  const familiarAndAlternatives = choices.filter((voice) =>
    /yuna|eddy|reed|rocko/i.test(voice.name),
  );
  const fallback = choices.filter(
    (voice) => !familiarAndAlternatives.includes(voice),
  );
  return [...familiarAndAlternatives, ...fallback].slice(0, 4);
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
      window.clearTimeout(timer);
      speech.removeEventListener("voiceschanged", finish);
      resolve(listKoreanVoices());
    };
    const timer = window.setTimeout(finish, timeoutMs);
    speech.addEventListener("voiceschanged", finish, { once: true });
    speech.getVoices();
  });
}

function playDeviceKorean(text: string, options: KoreanSpeechOptions = {}) {
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
      (savedRate >= 0.65 && savedRate <= 1.1 ? savedRate : undefined),
  };
  const voice = selectedKoreanVoice(voices, playbackOptions);
  // Never let the browser fall back to an English voice for Korean text.
  if (!voice) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice.lang.toLowerCase().startsWith("ko")
    ? voice.lang
    : "ko-KR";
  utterance.rate = Math.min(1.1, Math.max(0.65, playbackOptions.rate ?? 1));
  utterance.pitch = 1;
  utterance.voice = voice;
  window.speechSynthesis.cancel();
  if (queuedStart !== undefined) window.clearTimeout(queuedStart);
  queuedStart = window.setTimeout(() => {
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      // Some browsers expose the API but cannot start a local speech engine.
    }
    queuedStart = undefined;
  }, 40);
  return true;
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
  source: "catalog" | "elevenlabs" | "device" | "unavailable";
};
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
let activeAudio: HTMLAudioElement | undefined;
let activeUrl: string | undefined;
let pendingAudio: AbortController | undefined;
let playbackVersion = 0;
let settlePlayback: ((ended: boolean) => void) | undefined;

export async function playElevenLabsKorean(
  text: string,
  voice: ElevenLabsVoice = selectedElevenLabsVoice(),
  rate = 1,
  fallbackOptions: KoreanSpeechOptions = {},
): Promise<KoreanPlayback> {
  if (typeof window === "undefined")
    return { played: false, source: "unavailable" };
  stopKoreanPlayback();
  if (!paidFeaturesEnabled) {
    await waitForKoreanVoices();
    const played=playDeviceKorean(naturalSpeechText(text), {...fallbackOptions,rate});
    return {played,source:played ? "device" : "unavailable"};
  }
  const version = playbackVersion;
  const controller = new AbortController();
  pendingAudio = controller;
  const timeout = window.setTimeout(() => controller.abort(), 20_000);
  try {
    if (!apiUrl) throw new Error();
    const response = await fetch(`${apiUrl}/v1/speech/synthesize`, {
      method: "POST",
      credentials: "include",
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
      !response.ok ||
      !response.headers.get("content-type")?.toLowerCase().startsWith("audio/")
    )
      throw new Error();
    const blob = await response.blob();
    if (
      version !== playbackVersion ||
      controller.signal.aborted ||
      !blob.size ||
      blob.size > 5 * 1024 * 1024
    ) {
      throw new Error();
    }
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    activeUrl = url;
    activeAudio = audio;
    audio.playbackRate = Math.min(1.1, Math.max(0.65, rate));
    const release = () => {
      URL.revokeObjectURL(url);
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
        release();
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
      audio.onerror = () => finish(false);
    });
    await audio.play();
    window.clearTimeout(timeout);
    if (controller.signal.aborted || version !== playbackVersion) {
      audio.pause();
      release();
      throw new Error();
    }
    if (fallbackOptions.waitForEnd && !(await ended))
      return { played: false, source: "unavailable" };
    return { played: true, source: "elevenlabs" };
  } catch {
    if (version !== playbackVersion)
      return { played: false, source: "unavailable" };
    settlePlayback?.(false);
    activeAudio?.pause();
    if (activeUrl) URL.revokeObjectURL(activeUrl);
    activeAudio = undefined;
    activeUrl = undefined;
    if (fallbackOptions.naturalOnly || consonantName(text.trim()))
      return { played: false, source: "unavailable" };
    await waitForKoreanVoices();
    if (version !== playbackVersion)
      return { played: false, source: "unavailable" };
    const played = playDeviceKorean(text, {
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
  audio.playbackRate = Math.min(1.1, Math.max(0.65, rate));
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
  stopKoreanPlayback();
  if (!paidFeaturesEnabled) {
    await waitForKoreanVoices();
    const played=playDeviceKorean(naturalSpeechText(text), options);
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
