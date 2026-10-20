"use client";
import { freePublishing, tutorEnabled, publicApiUrl, deviceProfileKey, deviceProgressKey } from "./release";

import { useEffect, useMemo, useState, useRef } from "react";
import dynamic from "next/dynamic";
import {
  ArrowDownLeft,
  ArrowRight,
  BookOpenText,
  CalendarDots,
  Check,
  CheckCircle,
  Clock,
  Compass,
  Fire,
  House,
  Lightning,
  Microphone,
  SpeakerHigh,
  Sparkle,
  Target,
  UserCircle,
  Gear,
  X,
  ChatCircleDots,
} from "./ui/icons";
import {prefetchLocalKorean,usesBrowserConversationVoices} from "./ui/speech";
import {browserVoicesConsented,enableBrowserVoices} from "./ui/browser-voices";
import {GuestLearningContext} from "./ui/guest-learning";

import { readOptionalProgress } from "./ui/progress-response";

import type {LearnerAccount} from "./ui/account-modal";

import { reviewOverview } from "./ui/review-session";

import { FeatureGuide } from "./ui/feature-guide";
import { LevelFocus } from "./ui/level-focus";
import { FeedbackBanner } from "./ui/feedback-banner";
import { FeedbackReport } from "./ui/feedback-report";

import { normalizeSpeakingCardId, normalizeSpeakingCardIds } from "./speak-cards";


import { LandingPage } from "./ui/landing-page";
import { SoriMascot } from "./ui/sori-mascot";
import {habitProgress} from "./habit-progress";
import {HabitGarden} from "./ui/habit-garden";
import { DailyPractice } from "./ui/daily-practice";
import { WordPacks } from "./ui/word-packs";
import { WordReference } from "./ui/word-reference";
import { LearningRoadmap } from "./ui/learning-roadmap";
import { accountAvatar, weeklyProgress } from "./account-personalization";
import { recommendedLessons, learningRoute, placementKnowledge, defaultLearningProfile, type LearningProfile } from "./learning-profile";
import { listKoreanVoices, saveElevenLabsVoice, saveSpeechRate, speakKorean, stopKoreanPlayback } from "./ui/speech";
import { lessons, type Lesson, type TextQuestion } from "./curriculum";
import {
  isLessonUnlocked,
  learningPathways,
  lessonsForPathway,
  pathwayProgress,
  pathwayForLesson,
  prerequisiteLabel,
} from "./learning-pathways";
import { additionalVocabulary, hangulLetters, hangulSyllableExamples } from "./more-lessons";
import { wordBank, wordCategories, type KoreanWord } from "./word-bank";
import {
  createStarterReviewItems,
  createLessonReviewItems,
  createQuestionReviewItems,
  deduplicateReviewItems,
  dueReviewItems,
  initialProgress,
  defaultLearningPreferences,
  localDateKey,
  rateReviewItem,
  recordActivity,
  recordDailyPractice,
  type SavedProgress,
  type LearningPreferences,
} from "./progress";

type Tab = "today" | "learn" | "review" | "words" | "speak" | "tutor" | "practice";
const allTabs: { id: Tab; label: string; Icon: typeof House }[] = [
  { id: "today", label: "Today", Icon: House },
  { id: "learn", label: "Learn", Icon: Compass },
  { id: "practice", label: "Practice", Icon: Target },
  { id: "review", label: "Review", Icon: Lightning },
  { id: "words", label: "Words", Icon: BookOpenText },
  { id: "speak", label: "Speak", Icon: Microphone },
  { id: "tutor", label: "AI Tutor", Icon: ChatCircleDots },
];
const tabs = allTabs.filter(item => tutorEnabled || item.id !== "tutor");

function nextAvailableLesson(completedLessonIds: string[], profile = defaultLearningProfile) {
  return recommendedLessons(completedLessonIds, profile)[0] ?? lessons[0];
}

function normalizeProgress(
  value: Partial<SavedProgress> | null | undefined,
): SavedProgress {
  const hintLevel = value?.learningPreferences?.hintLevel;
  return {
    ...initialProgress,
    ...value,
    dailyPractice: value?.dailyPractice && Array.isArray(value.dailyPractice.lessons) && Array.isArray(value.dailyPractice.reviews) && Array.isArray(value.dailyPractice.speaking) ? value.dailyPractice : initialProgress.dailyPractice,
    speakingCardIds: Array.isArray(value?.speakingCardIds)
      ? normalizeSpeakingCardIds(value.speakingCardIds.filter((id): id is string => typeof id === "string"))
      : [],
    speakingCardId:
      typeof value?.speakingCardId === "string" ? normalizeSpeakingCardId(value.speakingCardId) : null,
    learningPreferences: {
      ...defaultLearningPreferences,
      ...(value?.learningPreferences ?? {}),
      romanization: typeof value?.learningPreferences?.romanization === "boolean"
        ? value.learningPreferences.romanization
        : defaultLearningPreferences.romanization,
      hangulSize: value?.learningPreferences?.hangulSize === "large" ? "large" : "standard",
      hintLevel: ["gentle", "standard", "challenge"].includes(hintLevel ?? "")
        ? hintLevel!
        : defaultLearningPreferences.hintLevel,
      speechVoice: value?.learningPreferences?.speechVoice === "chris" ? "chris" : "jessica",
      speechPace: Number.isFinite(value?.learningPreferences?.speechPace) &&
        Number(value?.learningPreferences?.speechPace) >= 0.65 && Number(value?.learningPreferences?.speechPace) <= 1.4
        ? Number(value?.learningPreferences?.speechPace)
        : 1,
    },
    dailyGoalMinutes: [5, 10, 15, 20, 30, 45, 60].includes(
      Number(value?.dailyGoalMinutes),
    )
      ? (Number(value?.dailyGoalMinutes) as SavedProgress["dailyGoalMinutes"])
      : 15,
    completedLessonIds: Array.isArray(value?.completedLessonIds)
      ? value.completedLessonIds
      : [],
    wordsLearned: Array.isArray(value?.wordsLearned) ? value.wordsLearned : [],
    activityDates: Array.isArray(value?.activityDates)
      ? value.activityDates
      : [],
    reviewItems: Array.isArray(value?.reviewItems) ? deduplicateReviewItems(value.reviewItems) : [],
  };
}

function SectionPending(){return <p role="status" aria-live="polite">Opening your learning space…</p>;}
const LessonModal=dynamic(()=>import("./ui/lesson-modal").then(module=>module.LessonModal),{loading:SectionPending});
const LearningOnboarding=dynamic(()=>import("./ui/learning-onboarding").then(module=>module.LearningOnboarding),{loading:SectionPending});
const ReviewDeck=dynamic(()=>import("./ui/review-modal").then(module=>module.ReviewModal),{loading:SectionPending});
const LearningCollection=dynamic(()=>import("./ui/learning-collection").then(module=>module.LearningCollection),{loading:SectionPending});
const SpeakDeck=dynamic(()=>import("./ui/speak-deck").then(module=>module.SpeakDeck),{loading:SectionPending});
const PracticePage=dynamic(()=>import("./ui/practice-page").then(module=>module.PracticePage),{loading:SectionPending});
const TutorPage=dynamic(()=>import("./ui/tutor-page").then(module=>module.TutorPage),{loading:SectionPending});
const AccountModal=dynamic(()=>import("./ui/account-modal").then(module=>module.AccountModal),{loading:SectionPending});

export default function Home() {
  useEffect(()=>{
    void prefetchLocalKorean("안녕하세요","chris").then(()=>prefetchLocalKorean("안녕하세요","jessica"));
    if(usesBrowserConversationVoices()&&browserVoicesConsented())void enableBrowserVoices().catch(()=>{});
  },[]);
  const [tab, setTab] = useState<Tab>("today");
  const [progress, setProgress] = useState(initialProgress);
  const currentStreak=habitProgress(progress).current;
  const [lessonOpen, setLessonOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(lessons[0]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewFocus, setReviewFocus] = useState<"due" | "missed" | "practice">("due");
  const [guestAuthOpen,setGuestAuthOpen]=useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountMode, setAccountMode] = useState<"create" | "login">("create");
  const restoreVersion=useRef(0);
  const [account, setAccount] = useState<LearnerAccount | null>(null);
  const guest=account?.id === "device-only";
  const [ready, setReady] = useState(false);


  useEffect(() => {
    async function restoreProgress() {
      const version=restoreVersion.current;
      let storedGuest=null;
      try { storedGuest=JSON.parse(window.localStorage.getItem(deviceProfileKey)??"null"); } catch {}
      if (freePublishing || storedGuest?.id === "device-only") {
        try {
          const profile = JSON.parse(window.localStorage.getItem(deviceProfileKey) ?? "null");
          if (profile?.id === "device-only" && ["new","hangul","basic","intermediate","advanced"].includes(profile.learningProfile?.level)) setAccount(profile);
          const saved = JSON.parse(window.localStorage.getItem(deviceProgressKey) ?? "null");
          if (saved) setProgress(normalizeProgress(saved));
        } catch { /* Invalid device data can be replaced by a new practice session. */ }
        setReady(true); return;
      }
      let current = initialProgress;
      let saved:string|null=null;
      try {saved=window.localStorage.getItem("sori-progress");}catch{}
      if (saved) {
        try {
          current = normalizeProgress(
            JSON.parse(saved) as Partial<SavedProgress>,
          );
        } catch {
          try{window.localStorage.removeItem("sori-progress");}catch{}
        }
      }
      setProgress(current);
      setReady(true); // Public content must not wait for the account server.
      const apiUrl = publicApiUrl;
      if (apiUrl) {
        try {
          const accountResponse = await fetch(`${apiUrl}/v1/auth/me`, {
            credentials: "include",
            signal: AbortSignal.timeout(65000),
          });
          if (accountResponse.ok) {
            const user =
              (await accountResponse.json()) as LearnerAccount | null;
            if (user?.id) {
              if(version!==restoreVersion.current)return;
              const progressResponse = await fetch(`${apiUrl}/v1/progress/me`, {
                credentials: "include",
              });
              if (!progressResponse.ok) throw new Error("Account progress unavailable");
              if (progressResponse.ok) {
                const remote =
                  await readOptionalProgress(progressResponse);
                if (remote) current = normalizeProgress(remote);
                else {
                  current = {...initialProgress, dailyGoalMinutes: user.learningProfile?.dailyMinutes ?? initialProgress.dailyGoalMinutes};
                  if(version!==restoreVersion.current)return;
                  await fetch(`${apiUrl}/v1/progress/me`, {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(current),
                  });
                }
              }
              if(version!==restoreVersion.current)return;
              setAccount(user);
            }
          }
        } catch {
          // Offline practice continues from browser storage.
        }
      }
      if(version!==restoreVersion.current)return;
      setProgress(current);
      setReady(true);
    }
    void restoreProgress();
  }, []);

  useEffect(() => {
    if (!ready || !account) return;
    try { window.localStorage.setItem(freePublishing || guest ? deviceProgressKey : "sori-progress", JSON.stringify(progress));
    if (guest && account) window.localStorage.setItem(deviceProfileKey,JSON.stringify(account)); } catch { /* Private browsing may not retain device progress. */ }

    saveElevenLabsVoice(progress.learningPreferences.speechVoice);
    saveSpeechRate(progress.learningPreferences.speechPace);
    const apiUrl = publicApiUrl;
    if (apiUrl && account && !guest) {
      const timer = window.setTimeout(() => {
        void fetch(`${apiUrl}/v1/progress/me`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(progress),
        }).catch(() => undefined);
      }, 250);
      return () => window.clearTimeout(timer);
    }
  }, [progress, ready, account]);

  const title = useMemo(
    () =>
      ({
        today: "Today",
        learn: "Your learning path",
        review: "A little recall goes a long way",
        words: "A little word goes a long way",
        speak: "Find your Korean voice",
        tutor: "Your Korean tutor",
        practice: "Your practice space",
      })[tab],
    [tab],
  );
  const todayDate = new Date();
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
    .format(todayDate)
    .toUpperCase();

  function startLesson(lesson?: Lesson) {
    setSelectedLesson(lesson ?? nextAvailableLesson(progress.completedLessonIds, account?.learningProfile));
    setLessonOpen(true);
  }

  function navigateTo(next: Tab) {
    if (next === tab) return;
    setTab(next);
    window.scrollTo({top:0,behavior:"instant"});

  }

  function finishLesson(
    lesson: Lesson,
    score: { correct: number; total: number },
  ) {
    const hangulReadingQuestions: TextQuestion[] = lesson.category === "Hangul"
      ? lesson.words.flatMap((korean) => {
          const sample = hangulSyllableExamples.find((item) => item.korean === korean);
          const letter = hangulLetters.find((item) => item.korean === korean);
          if (!sample && !letter) return [];
          return [{
            id: `reading-${sample?.id ?? letter!.id}`,
            type: "text" as const,
            korean,
            prompt: sample ? "Recall this Hangul syllable’s romanized sound." : "Recall this letter’s romanized name or vowel sound.",
            answer: sample?.romanization ?? letter!.romanization,
            accepted: [],
            placeholder: "Romanized sound or name",
            tip: sample
              ? `${sample.letters.join(" + ")} builds ${sample.korean}, read as ${sample.romanization}. This is a syllable reading sample.`
              : `${letter!.korean} (${letter!.romanization}) gives ${letter!.meaning}. Example: ${letter!.example}.`,
          }];
        })
      : [];
    const lessonWords = lesson.words
      .map((korean) => {
        if (lesson.category === "Hangul" && hangulReadingQuestions.some((question) => question.korean === korean)) return null;
        const word = [...wordBank, ...additionalVocabulary].find(
          (item) => item.korean === korean,
        );
        return word
          ? {
              korean: word.korean,
              romanization: word.romanization,
              meaning: word.meaning,
            }
          : null;
      })
      .filter((word): word is NonNullable<typeof word> => word !== null);
    const freshReviewItems = [
      ...createQuestionReviewItems(lesson.id, lesson.questions),
      ...createQuestionReviewItems(lesson.id, hangulReadingQuestions),
      ...createLessonReviewItems(lessonWords),
    ];
    setProgress((current) => {
      const completedLessonIds = current.completedLessonIds.includes(lesson.id)
        ? current.completedLessonIds
        : [...current.completedLessonIds, lesson.id];
      return recordDailyPractice(recordActivity({
        ...current,
        completedLessonIds,
        completed: completedLessonIds.length,
        wordsLearned: [...new Set([...current.wordsLearned, ...(lesson.category === "Hangul" ? [] : lessonWords.map((word) => word.korean))])],
        quizAttempts: current.quizAttempts + score.total,
        quizCorrect: current.quizCorrect + score.correct,
        reviewItems: deduplicateReviewItems([
          ...(current.reviewItems.length ? current.reviewItems : lesson.id === "hangul-first-sounds" ? createStarterReviewItems() : []),
          ...freshReviewItems,
        ]),
      }), "lessons", lesson.id);
    });
    setLessonOpen(false);
    setTab("today");
  }

  async function authenticateLearner(user: LearnerAccount) {
    restoreVersion.current++;
    const apiUrl = publicApiUrl;
    if (apiUrl) {
      const response = await fetch(`${apiUrl}/v1/progress/me`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Your saved progress could not be loaded. Please try signing in again.");
      const remote = await readOptionalProgress(response);
      if (remote) setProgress(normalizeProgress(remote));
      else {
        const fresh = {...(guest ? progress : initialProgress), dailyGoalMinutes:user.learningProfile?.dailyMinutes ?? progress.dailyGoalMinutes};
        const saved = await fetch(`${apiUrl}/v1/progress/me`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fresh),
        });
        if (!saved.ok) throw new Error("Your new learning space could not be saved. Please try again.");
        setProgress(fresh);
      }
    }
    try {window.localStorage.removeItem(deviceProfileKey);}catch{}
    setGuestAuthOpen(false);setAccountOpen(false);
    setAccount(user);
  }

  async function signOut() {
    restoreVersion.current++;
    if(guest){try{window.localStorage.removeItem(deviceProfileKey);}catch{}setAccount(null);return;}
    const apiUrl = publicApiUrl;
    if (apiUrl) {
      await fetch(`${apiUrl}/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    }
    setAccount(null);
  }

  async function deleteAccount() {
    if (freePublishing || guest) { window.localStorage.removeItem(deviceProfileKey); window.localStorage.removeItem(deviceProgressKey); setProgress(initialProgress); setAccount(null); return; }
    const apiUrl = publicApiUrl;
    if (apiUrl) {
      const response = await fetch(`${apiUrl}/v1/account/me`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Account deletion failed");
    }
    setAccount(null);
  }

  async function updateAccount(updated: LearnerAccount) {
    const levelChanged = updated.learningProfile?.level !== account?.learningProfile?.level;
    const nextProgress = {...progress,dailyGoalMinutes:updated.learningProfile?.dailyMinutes ?? progress.dailyGoalMinutes};
    setAccount(updated); setProgress(nextProgress);
    if (!levelChanged) return;
    stopKoreanPlayback();
    window.localStorage.setItem(freePublishing || guest ? deviceProgressKey : "sori-progress", JSON.stringify(nextProgress));
    if (freePublishing || guest) window.localStorage.setItem(deviceProfileKey, JSON.stringify(updated));
    else if (publicApiUrl) {
      const response = await fetch(`${publicApiUrl}/v1/progress/me`, {method:"PUT",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(nextProgress)});
      if (!response.ok) throw new Error("Your level was saved, but progress could not sync. Please try again before refreshing.");
    }
    setLessonOpen(false);setReviewOpen(false);setAccountOpen(false);setSettingsOpen(false);setReady(false);
    window.setTimeout(()=>window.location.reload(),150);
  }

  if (!ready) {
    return (
      <main className="landing-loading" aria-live="polite">
        <SoriMascot className="loading-mascot" />
        <span className="brand-name">saegim<span>.</span></span>
        <p>Getting your learning space ready…</p>
      </main>
    );
  }

  if (!account) {
    return (
      <main className="landing-shell">
        <LandingPage
          freeMode={freePublishing}
          onStartGuest={()=>{restoreVersion.current++;try {const saved=JSON.parse(window.localStorage.getItem(deviceProgressKey)??"null");setProgress(saved?normalizeProgress(saved):initialProgress);}catch{setProgress(initialProgress);}setAccount({id:"device-only",email:"",displayName:"Learner",learningProfile:{...defaultLearningProfile,onboardingCompleted:false}});}}
          onCreateAccount={() => {
            restoreVersion.current++;
            if (freePublishing) {
              try { const saved=JSON.parse(window.localStorage.getItem(deviceProfileKey)??"null");
                if (saved?.id === "device-only" && saved.learningProfile?.onboardingCompleted) { setAccount(saved); return; }
              } catch { /* Start a fresh profile if its stored copy is invalid. */ }
              setAccount({id:"device-only",email:"",displayName:"Learner",learningProfile:{...defaultLearningProfile,onboardingCompleted:false}}); return;
            }
            setAccountMode("create");
            setAccountOpen(true);
          }}
          onSignIn={() => {
            restoreVersion.current++;
            setAccountMode("login");
            setAccountOpen(true);
          }}
        />
        {accountOpen && (
          <AccountModal
            apiUrl={publicApiUrl}
            account={null}
            initialMode={accountMode}
            onClose={() => setAccountOpen(false)}
            onAuthenticated={authenticateLearner}
            onSignOut={signOut}
            onDelete={deleteAccount}
          />
        )}
      </main>
    );
  }

  if (!account.learningProfile?.onboardingCompleted) return <LearningOnboarding account={account} onSignOut={signOut} onSaved={updated => {setAccount(updated);setProgress(current=>({...current,dailyGoalMinutes:updated.learningProfile?.dailyMinutes??15}));}} />;

  return (
    <GuestLearningContext.Provider value={guest}><main className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <a
          className="brand"
          href="#today"
          onClick={() => navigateTo("today")}
          aria-label="Saegim home"
        >
          <SoriMascot className="brand-mark" />
          <span className="brand-name">
            saegim<span>.</span>
          </span>
        </a>
        <p className="brand-caption">Korean, remembered.</p>
        <div className="side-label">YOUR SPACE</div>
        <nav className="side-nav">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`nav-item ${tab === id ? "active" : ""}`}
              onClick={() => navigateTo(id)}
              aria-current={tab === id ? "page" : undefined}
            >
              <Icon
                size={19}
                weight={tab === id ? "fill" : "regular"}
                aria-hidden="true"
              />
              <span>{label}</span>
              {id === "review" && dueReviewItems(progress).length > 0 && (
                <span className="nav-count">
                  {dueReviewItems(progress).length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="side-note">
          <Sparkle className="note-spark" size={18} aria-hidden="true" />
          <p>Little steps add up.</p>
          <span>오늘도 화이팅</span>
        </div>
        <div className="profile-row">
          <div className="avatar" aria-hidden="true">
            {account?.displayName.slice(0, 1).toUpperCase() ?? "S"}
          </div>
          <div className="profile-copy">
            <strong>{account?.displayName ?? "Language learner"}</strong>
            <span>
              {account
                ? freePublishing || guest ? "Device-only learning" : "Free learner account"
                : currentStreak
                  ? `Beginner · ${currentStreak} day${currentStreak === 1 ? "" : "s"}`
                  : "Beginner · New learner"}
            </span>
          </div>
        </div>
      </aside>

      <section className="main-area" id="today">
        <header className="topbar">
          <div className="breadcrumb">
            <span>My Korean</span>
            <span className="crumb-slash">/</span>
            <strong>{title}</strong>
          </div>
          <div className="topbar-right">
            <button className="settings-icon-button" aria-label="Open Settings" onClick={()=>{setAccountOpen(false);setSettingsOpen(true);}}><Gear size={22}/></button>
            <span className="free-pill">
              <span /> Always free
            </span>
            <button
              className="account-open"
              onClick={() => setAccountOpen(true)}
            >
              <UserCircle size={17} />
              <span>{account ? `${accountAvatar(account.learningProfile)} My Account` : "Create Account"}</span>
            </button>
          </div>
        </header>

        <div className="page-content">
          <FeatureGuide sections={tabs} onNavigate={navigateTo} onSettings={()=>{setAccountOpen(false);setSettingsOpen(true);}} />
          <FeedbackBanner compact />
          <div className="greeting-row">
            <div>
              {tab === "today" && account && (
                <p className="home-welcome">
                  <SoriMascot className="home-welcome-mascot" />
                  <span>Welcome back, {account.displayName.trim().split(/\s+/u)[0] || "friend"}</span>
                </p>
              )}
              <h1>
                {tab === "today" ? (
                  <>
                    A little Korean
                    <br className="mobile-break" /> goes a long way.
                  </>
                ) : (
                  title
                )}
              </h1>
              <p className="subhead">
                {tab === "today"
                  ? "Your pace. Your path. A free place to grow."
                  : today}
              </p>
            </div>
            <div className="streak-chip">
              <span className="streak-icon">
                <Fire size={18} weight="fill" />
              </span>
              <span>
                <strong>
                  {currentStreak
                    ? `${currentStreak} day${currentStreak === 1 ? "" : "s"}`
                    : "Start your streak"}
                </strong>
                <small>
                  {currentStreak
                    ? "learning streak"
                    : "One lesson is enough to begin"}
                </small>
              </span>
              <span className="streak-line" aria-hidden="true">
                {[7, 12, 16, 10, 14, 18, 12].map((height, index) => (
                  <i
                    key={index}
                    className={
                      index >= 7 - Math.min(currentStreak, 7) ? "active" : ""
                    }
                    style={{ height }}
                  />
                ))}
              </span>
            </div>
          </div>

          <div className="section-view" key={`${tab}-${account.learningProfile?.level}`}>
          {tab === "today" && (
            <TodayView
              onMissedReview={() => { setReviewFocus("missed"); setReviewOpen(true); }}
              learningProfile={account.learningProfile ?? defaultLearningProfile}
              progress={progress}
              todayDate={todayDate}
              onLesson={startLesson}
              onReview={() => setReviewOpen(true)}
              onSpeak={() => setTab("speak")}
          onTab={navigateTo}
              onGoalChange={(minutes) =>
                setProgress((current) => ({
                  ...current,
                  dailyGoalMinutes: minutes,
                }))
              }
            />
          )}
          {tab === "learn" && (
            <LearnView progress={progress} onLesson={startLesson} learningProfile={account.learningProfile ?? defaultLearningProfile} />
          )}
          {tab === "review" && (
            <ReviewView
              progress={progress}
              onPractice={() => { setReviewFocus("practice"); setReviewOpen(true); }}
              onMissed={() => { setReviewFocus("missed"); setReviewOpen(true); }}
              onReview={() => setReviewOpen(true)}
              onLesson={() => {
                navigateTo("today");
                startLesson();
              }}
            />
          )}
          {tab === "words" && (
            <WordsView
              learnedWords={progress.wordsLearned}
              apiUrl={guest ? undefined : publicApiUrl}
              onHear={(text) => speakKorean(text)}
            />
          )}
          {tab === "speak" && (
            <SpeakDeck
              profile={account.learningProfile ?? defaultLearningProfile}
              completedLessonIds={progress.completedLessonIds}
              completedIds={progress.speakingCardIds}
              currentCardId={progress.speakingCardId}
              preferences={progress.learningPreferences}
              onPreferencesChange={(learningPreferences) =>
                setProgress((current) => ({ ...current, learningPreferences }))
              }
              onNavigate={(cardId) =>
                setProgress((current) =>
                  current.speakingCardId === cardId
                    ? current
                    : { ...current, speakingCardId: cardId },
                )
              }
              onComplete={(completedId, nextCardId) =>
                setProgress((current) =>
                  recordDailyPractice(recordActivity({
                    ...current,
                    speakingCardIds: [
                      ...new Set([...current.speakingCardIds, completedId]),
                    ],
                    speakingCardId: nextCardId,
                  }), "speaking", completedId),
                )
              }
            />
          )}
          {tab === "practice" && <PracticePage key={account.learningProfile?.level ?? "new"} progress={progress} profile={account.learningProfile ?? defaultLearningProfile} preferences={progress.learningPreferences} onSessionComplete={() => setProgress((current) => recordActivity(current))} />}
          {tab === "tutor" && guest && <section><h2>Your tutor, when you’re ready</h2><p>Lessons, cards and written practice work without an email. An optional account unlocks AI practice within the free daily limits.</p><button className="button button-dark" onClick={()=>{setGuestAuthOpen(true);setAccountMode("create");setAccountOpen(true);}}>Create an optional account</button></section>}
          {tab === "tutor" && !guest && tutorEnabled && <TutorPage learningProfile={account.learningProfile ?? defaultLearningProfile} completedLessonIds={progress.completedLessonIds} />}
          </div>



          {guest && <aside className="guest-learning-note"><p>Guest practice · Progress stays in this browser. Clearing site data or private browsing can erase it.</p><button className="button button-quiet" onClick={()=>{setGuestAuthOpen(true);setAccountMode("create");setAccountOpen(true);}}>Optional account for syncing</button></aside>}
          <FeedbackReport area={tab} publishing={freePublishing}/>
          <footer className="page-footer">
            <span>Made for curious minds, with care.</span>
            <span>
              <span className="footer-seal">한</span>{" "}
              <strong>한국어, 한 걸음씩</strong>{" "}
              <span>— Korean, one step at a time.</span>
            </span>
          </footer>
        </div>
      </section>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => navigateTo(id)}
            className={tab === id ? "selected" : ""}
            aria-current={tab === id ? "page" : undefined}
          >
            <Icon size={20} weight={tab === id ? "fill" : "regular"} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {lessonOpen && (
        <LessonModal
          key={selectedLesson.id}
          lesson={selectedLesson}
          preferences={progress.learningPreferences}
          onPreferencesChange={(learningPreferences) => setProgress((current) => ({ ...current, learningPreferences }))}
          onClose={() => setLessonOpen(false)}
          onComplete={finishLesson}
        />
      )}
      {reviewOpen && (
        <ReviewDeck
          preferences={progress.learningPreferences}
          onPreferencesChange={learningPreferences=>setProgress(current=>({...current,learningPreferences}))}
          maxCards={reviewFocus === "practice" ? 10 : undefined}
          items={reviewFocus === "missed" ? progress.reviewItems.filter((item) => item.lastResult === "again") : reviewFocus === "practice" ? progress.reviewItems : dueReviewItems(progress)}
          onRate={(id, remembered) =>
            setProgress((current) => rateReviewItem(current, id, remembered))
          }
          onClose={() => { setReviewOpen(false); setReviewFocus("due"); }}
        />
      )}
      {(accountOpen || settingsOpen) && (
        <AccountModal
          settingsOnly={settingsOpen}
          completedLessonIds={progress.completedLessonIds}
          onOpenSettings={()=>{setAccountOpen(false);setSettingsOpen(true);}}
          apiUrl={publicApiUrl}
          account={guest && guestAuthOpen ? null : {...account,learningProfile:{...(account.learningProfile??defaultLearningProfile),dailyMinutes:progress.dailyGoalMinutes}}}
          preferences={progress.learningPreferences}
          onAccountUpdated={updateAccount}
          onPreferencesChange={(learningPreferences) =>
            setProgress((current) => ({ ...current, learningPreferences }))
          }
          onClose={() => {setAccountOpen(false);setSettingsOpen(false);setGuestAuthOpen(false);}}
          onAuthenticated={authenticateLearner}
          onSignOut={signOut}
          onDelete={deleteAccount}
        />
      )}
    </main></GuestLearningContext.Provider>
  );
}

function TodayView({
  onMissedReview,
  learningProfile,
  progress,
  todayDate,
  onLesson,
  onReview,
  onSpeak,
  onTab,
  onGoalChange,
}: {
  onMissedReview: () => void;
  learningProfile: LearningProfile;
  progress: SavedProgress;
  todayDate: Date;
  onLesson: (lesson?: Lesson) => void;
  onReview: () => void;
  onSpeak: () => void;
  onTab: (tab: Tab) => void;
  onGoalChange: (minutes: SavedProgress["dailyGoalMinutes"]) => void;
}) {
  const weekStart = new Date(todayDate);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    return {
      label: new Intl.DateTimeFormat("en-US", { weekday: "narrow" }).format(
        date,
      ),
      key: localDateKey(date),
    };
  });
  const dueCount = dueReviewItems(progress).length;
  const nextLesson = nextAvailableLesson(progress.completedLessonIds, learningProfile);
  const weekly = weeklyProgress(progress.activityDates, learningProfile.weeklyGoal ?? 5, todayDate);
  const levelRoute = learningRoute(learningProfile).filter((lesson) => !placementKnowledge(learningProfile).includes(lesson.id));
  const hangulProgress = { completed: levelRoute.filter((lesson) => progress.completedLessonIds.includes(lesson.id)).length, total: levelRoute.length };
  return (
    <>
      <div className="daily-goal-row">
        <div>
          <span className="micro-label">YOUR DAILY RHYTHM</span>
          <strong>Choose a little time that feels doable.</strong>
        </div>
        <label>
          <span className="sr-only">Daily study time</span>
          <select
            value={progress.dailyGoalMinutes}
            onChange={(event) =>
              onGoalChange(
                Number(event.target.value) as SavedProgress["dailyGoalMinutes"],
              )
            }
          >
            {[5, 10, 15, 20, 30, 45, 60].map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} minutes a day
              </option>
            ))}
          </select>
        </label>
      </div>
      <HabitGarden progress={progress} onPractice={()=>onLesson(nextLesson)}/>
      <DailyPractice profile={learningProfile} progress={progress} onLesson={() => onLesson(nextLesson)} onReview={onReview} onSpeak={onSpeak} />
      <section className="weekly-plan"><div><span className="micro-label">YOUR WEEK, YOUR PACE</span><h3>{weekly.complete ? "Your weekly goal is met!" : `${weekly.studied} of ${weekly.goal} study days this week`}</h3><p>{weekly.complete ? "Keep exploring or take a well-earned break. Your progress stays here." : `${weekly.remaining} more study ${weekly.remaining === 1 ? "day" : "days"} to your goal. A lesson, review, or speaking practice counts.`}</p></div><progress value={Math.min(weekly.studied, weekly.goal)} max={weekly.goal} aria-label="Weekly study goal" /></section>
      <LearningRoadmap profile={learningProfile} completed={progress.completedLessonIds} onLesson={onLesson} />
      {progress.reviewItems.some((item) => item.lastResult === "again") && <section className="recovery-practice"><div><span className="micro-label">A SECOND CHANCE</span><h3>Turn a missed answer into a remembered one.</h3><p>{progress.reviewItems.filter((item) => item.lastResult === "again").length} cards you marked Again. Practice now, even before the next scheduled review.</p></div><button type="button" className="button button-dark" onClick={onMissedReview}>Practice missed cards</button></section>}
      <div className="dashboard-grid">
        <div className="primary-column">
          <section className="continue-panel">
            <div className="continue-copy">
              <span className="micro-label">FOR YOUR LEVEL · {learningProfile.reasons.map((reason) => reason === "work-study" ? "work & study" : reason).join(" + ")}</span>
              <h2>{nextLesson.title}</h2>
              <p>{nextLesson.detail}. A short practice session, always free.</p>
              <div className="lesson-meta">
                <span>
                  <Clock size={15} /> {nextLesson.minutes} min
                </span>
                <span>
                  <BookOpenText size={16} /> {nextLesson.category}
                </span>
              </div>
              <button className="button button-dark" onClick={() => onLesson(nextLesson)}>
                {progress.completedLessonIds.length
                  ? "Keep learning"
                  : "Start learning"}{" "}
                <ArrowRight size={17} weight="bold" />
              </button>
            </div>
            <div className="hangul-art" aria-label="Korean syllable 한, han">
              <div className="art-orbit orbit-one" />
              <div className="art-orbit orbit-two" />
              <div className="art-dot dot-one" />
              <div className="art-dot dot-two" />
              <div className="hangul-stamp">한</div>
              <span className="art-caption">one small beginning</span>
            </div>
          </section>

          <section className="review-strip">
            <div className="review-icon">
              <Lightning size={20} weight="fill" />
            </div>
            <div className="review-text">
              <strong>
                {!progress.completed
                  ? "Your review deck starts here"
                  : dueCount
                    ? `${dueCount} little things to remember`
                    : "You’re all caught up"}
              </strong>
              <span>
                {!progress.completed
                  ? "Finish a lesson to add your first review cards."
                  : dueCount
                    ? "Recall first, then check the answer."
                    : "Your next review is scheduled for later."}
              </span>
            </div>
            <div className="review-items">
              {(progress.reviewItems.length ? progress.reviewItems.slice(0,3).map(item=>item.front) : nextLesson.words.slice(0,3)).map((word,index)=><span key={`${word}-${index}`}>{word}</span>)}
              {progress.reviewItems.length>3 && <span className="more-items">+{progress.reviewItems.length-3}</span>}
            </div>
            <button
              className="icon-arrow"
              onClick={
                !progress.completed
                  ? () => onLesson(nextLesson)
                  : dueCount
                    ? onReview
                    : undefined
              }
              aria-label={
                !progress.completed
                  ? "Start your first lesson"
                  : dueCount
                    ? "Start your review"
                    : "No reviews due"
              }
              disabled={progress.completed > 0 && dueCount === 0}
            >
              {!progress.completed ? (
                <BookOpenText size={18} />
              ) : (
                <ArrowRight size={18} />
              )}
            </button>
          </section>

          <div className="lower-row">
            <section className="practice-card">
              <div className="practice-top">
                <div className="practice-emblem">
                  <Target size={18} />
                </div>
              </div>
              <h3>
                Build a tiny
                <br />
                learning habit.
              </h3>
              <p>One lesson, one review. That’s a lovely start.</p>
              <button className="text-link" onClick={() => onTab("learn")}>
                See your path <ArrowRight size={15} />
              </button>
              <Sparkle
                className="practice-scribble"
                size={48}
                aria-hidden="true"
              />
            </section>
            <section className="progress-card">
              <div className="section-heading">
                <h3>Your momentum</h3>
              </div>
              <div className="progress-stats">
                <div>
                  <strong>{progress.completed}</strong>
                  <span>lessons done</span>
                </div>
                <div>
                  <strong>{progress.wordsLearned.length}</strong>
                  <span>words met</span>
                </div>
                <div>
                  <strong>
                    {progress.quizAttempts
                      ? `${Math.round((progress.quizCorrect / progress.quizAttempts) * 100)}%`
                      : "—"}
                  </strong>
                  <span>first-try recall</span>
                </div>
              </div>
              <div className="week-row">
                <span className="week-label">THIS WEEK</span>
                {week.map(({ label, key }) => {
                  const active = progress.activityDates.includes(key);
                  return (
                    <span
                      className={`week-day ${active ? "done" : ""} ${key === localDateKey(todayDate) ? "today" : ""}`}
                      key={key}
                      aria-label={`${key}${active ? ", studied" : ""}`}
                    >
                      {label}
                      {active ? <Check size={12} weight="bold" /> : <i />}
                    </span>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
        <aside className="right-column">
          <section className="path-card">
            <div className="section-heading">
              <div>
                <h3>
                  Your next
                  <br />
                  learning steps
                </h3>
              </div>
              <div className="path-count">
                {hangulProgress.completed}
                <span>/ {String(hangulProgress.total).padStart(2, "0")}</span>
              </div>
            </div>
            <div className="path-track">
              <div className="track-line">
                <i
                  style={{
                    transform: `scaleY(${hangulProgress.total ? Math.min((hangulProgress.completed / hangulProgress.total) * 100, 100) / 100 : 0})`,
                  }}
                />
              </div>
              {learningRoute(learningProfile).filter((lesson) => !placementKnowledge(learningProfile).includes(lesson.id) && !progress.completedLessonIds.includes(lesson.id)).slice(0, 5).map((lesson, index) => {
                const complete = progress.completedLessonIds.includes(lesson.id);
                const available = isLessonUnlocked(lesson, progress.completedLessonIds, placementKnowledge(learningProfile));
                const state = complete
                  ? "complete"
                  : available
                    ? "active"
                    : "locked";
                return (
                  <PathStep
                    key={lesson.id}
                    number={String(index + 1).padStart(2, "0")}
                    title={lesson.title}
                    detail={lesson.category}
                    state={state}
                    onClick={() => onLesson(lesson)}
                  />
                );
              })}
            </div>
            <button
              className="text-link path-link"
              onClick={() => onTab("learn")}
            >
              Explore the full path <ArrowRight size={15} />
            </button>
          </section>
          <section className="quote-note">
            <span className="quote-mark">“</span>
            <p>
              매일 조금씩
              <br />
              Every day, a little.
            </p>
            <span className="quote-foot">YOUR REMINDER, IF YOU NEED IT</span>
          </section>
        </aside>
      </div>
      <div className="below-note">
        <CalendarDots size={17} />
        <span>
          {!progress.completed
            ? `Small steps count. Your next step is ${nextLesson.title}.`
            : dueCount
              ? "Your review brings earlier sounds back while they are still familiar."
              : "Your next review is scheduled for later."}
        </span>
        <button
          onClick={
            !progress.completed
              ? () => onLesson(nextLesson)
              : dueCount
                ? onReview
                : undefined
          }
          disabled={progress.completed > 0 && dueCount === 0}
        >
          {!progress.completed
            ? "Start lesson"
            : dueCount
              ? "Review now"
              : "All caught up"}{" "}
          <ArrowDownLeft size={14} />
        </button>
      </div>
    </>
  );
}

function PathStep({
  number,
  title,
  detail,
  state,
  onClick,
}: {
  number: string;
  title: string;
  detail: string;
  state: "active" | "next" | "locked" | "complete";
  onClick: () => void;
}) {
  return (
    <button
      className={`path-step ${state}`}
      onClick={onClick}
      disabled={state !== "active" && state !== "complete"}
      aria-label={`${title}, ${detail}${state === "active" ? ", start lesson" : state === "complete" ? ", lesson complete, review lesson" : ", coming later"}`}
    >
      <span className="step-marker">
        {state === "active" ? (
          <SpeakerHigh size={15} weight="fill" aria-hidden="true" />
        ) : state === "next" ? (
          <span />
        ) : state === "complete" ? (
          <Check size={14} weight="bold" aria-hidden="true" />
        ) : (
          <span className="lock-mark">·</span>
        )}
      </span>
      <span className="step-copy">
        <strong>{title}</strong>
        <small>{state === "complete" ? "Lesson complete" : detail}</small>
      </span>
      <span className="step-number">{state === "active" ? "NOW" : number}</span>
    </button>
  );
}

function LearnView({
  learningProfile,
  progress,
  onLesson,
}: {
  learningProfile: LearningProfile;
  progress: SavedProgress;
  onLesson: (lesson?: Lesson) => void;
}) {
  const routeOrder = new Map(learningRoute(learningProfile).map((lesson, index) => [lesson.id, index]));
  const [readyOnly, setReadyOnly] = useState(false);
  const pathwayOrder = learningProfile.level === "new" ? ["hangul", "everyday", "grammar", "daily-life", "connections", "stretch"] : (learningProfile.level === "intermediate" || learningProfile.level === "advanced") ? ["stretch", "grammar", "everyday", "daily-life", "connections", "hangul"] : ["everyday", "grammar", "daily-life", "connections", "hangul", "stretch"];
  const recommendation = nextAvailableLesson(progress.completedLessonIds, learningProfile);
  return (
    <div className="content-page">
      <div className="page-intro">
        <p>
          Your starting level and interests guide the recommended next lesson. Change them in Settings whenever you need to.
          Every step stays free.
        </p>
      </div>
      <div className="learning-pathways">
        <section className="daily-practice"><span className="micro-label">RECOMMENDED FOR YOU</span><h3>{recommendation.title}</h3><p>{recommendation.detail}. Chosen using your starting level, interests, and completed prerequisites.</p><button type="button" className="button button-dark" onClick={() => onLesson(recommendation)}>Start this lesson</button></section>
        <LevelFocus profile={learningProfile} />
        <LearningRoadmap profile={learningProfile} completed={progress.completedLessonIds} onLesson={onLesson} />
        <details className="learning-progress-details"><summary>My progress & topic chapters<span>See what you’ve learned</span></summary><LearningCollection completed={progress.completedLessonIds} items={progress.reviewItems} profile={learningProfile} onLesson={onLesson} /></details>
        <label className="course-view-control">Browse lessons<select value={readyOnly ? "ready" : "all"} onChange={event=>setReadyOnly(event.target.value === "ready")}><option value="all">All lessons, including upcoming steps</option><option value="ready">Ready to start or revisit</option></select></label>
        {[...learningPathways].sort((left, right) => pathwayOrder.indexOf(left.id) - pathwayOrder.indexOf(right.id)).map((pathway) => {
          const pathwayLessons = lessonsForPathway(pathway.id).filter(lesson=>!readyOnly || isLessonUnlocked(lesson,progress.completedLessonIds,placementKnowledge(learningProfile))).sort((left, right) => (routeOrder.get(left.id) ?? 0) - (routeOrder.get(right.id) ?? 0));
          const pathwayStats = pathwayProgress(pathway.id, progress.completedLessonIds);
          return (
            <section className="learning-pathway" key={pathway.id} aria-labelledby={`pathway-${pathway.id}`}>
              <div className="learning-pathway-heading">
                <div>
                  <span className="micro-label">{pathway.id === "hangul" ? "LETTERS & READING" : pathway.id === "grammar" ? "SENTENCE FOUNDATIONS" : pathway.id === "stretch" ? "CONNECTED PRACTICE" : "WORDS TO CONVERSATION"}</span>
                  <h2 id={`pathway-${pathway.id}`}>{pathway.title}</h2>
                  <p>{pathway.description}</p>
                </div>
                <span className="pathway-progress" aria-label={`${pathwayStats.completed} of ${pathwayStats.total} lessons complete`}>
                  {String(pathwayStats.completed).padStart(2, "0")}<small> / {String(pathwayStats.total).padStart(2, "0")}</small>
                </span>
              </div>
              <progress className="pathway-completion-bar" max={pathwayStats.total} value={pathwayStats.completed} aria-label={`${pathway.title} lessons completed`} />
              <details className="pathway-courses" open={pathwayForLesson(recommendation)===pathway.id}>
              <summary>{readyOnly ? `${pathwayLessons.length} ready to start or revisit` : `Explore ${pathwayStats.total} lessons`} <span>{pathwayStats.completed} completed</span></summary>
              <div className="course-list">
                {!pathwayLessons.length && <p className="course-empty">Earlier steps open these lessons. Switch to all lessons to see their prerequisites.</p>}
                {pathwayLessons.map((lesson, index) => {
                  const complete = progress.completedLessonIds.includes(lesson.id);
                  const unlocked = isLessonUnlocked(lesson, progress.completedLessonIds, placementKnowledge(learningProfile));
                  const next = !complete && unlocked && nextAvailableLesson(progress.completedLessonIds, learningProfile).id === lesson.id;
                  const prerequisite = prerequisiteLabel(lesson, progress.completedLessonIds, placementKnowledge(learningProfile));
                  return (
                    <CourseRow
                      key={lesson.id}
                      number={String(index + 1).padStart(2, "0")}
                      title={lesson.title}
                      detail={`${lesson.detail} · ${lesson.words.length} concepts${(!unlocked || lesson.prerequisiteLessonIds?.length) ? ` · ${prerequisite}` : ""}`}
                      tag={complete ? "COMPLETE · REVIEW" : next ? "START HERE" : unlocked ? `${lesson.minutes} MIN · READY` : "LOCKED"}
                      state={complete ? "complete" : unlocked ? "active" : "locked"}
                      onClick={() => onLesson(lesson)}
                    />
                  );
                })}
              </div>
              </details>
            </section>
          );
        })}
      </div>
      <div className="free-promise">
        <CheckCircle size={20} />
        <div>
          <strong>Every lesson stays yours.</strong>
          <span>
            No trial countdown. No learning features hidden behind a
            subscription.
          </span>
        </div>
      </div>
    </div>
  );
}

function CourseRow({
  number,
  title,
  detail,
  tag,
  state,
  onClick,
}: {
  number: string;
  title: string;
  detail: string;
  tag: string;
  state: "active" | "locked" | "complete";
  onClick: () => void;
}) {
  return (
    <button
      className={`course-row ${state}`}
      onClick={onClick}
      disabled={state === "locked"}
      aria-label={`${title}, ${detail}${state === "active" ? ", start lesson" : state === "complete" ? ", lesson complete, review lesson" : ", complete the listed prerequisite lessons to unlock"}`}
    >
      <span className="course-number">{number}</span>
      <span className="course-title">
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <span className="course-tag">{tag}</span>
      <ArrowRight size={18} aria-hidden="true" />
    </button>
  );
}

function WordsView({
  learnedWords,
  apiUrl,
  onHear,
}: {
  learnedWords: string[];
  apiUrl?: string;
  onHear: (text: string) => boolean;
}) {
  const [category, setCategory] = useState("All words");
  const [collection, setCollection] = useState<"all" | "learned">("all");
  const [search, setSearch] = useState("");
  const [remoteWords, setRemoteWords] = useState<KoreanWord[]>([]);
  const [remoteTotal, setRemoteTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [offlineReferenceWords, setOfflineReferenceWords] = useState<KoreanWord[]>([]);
  const pageSize = 60;

  useEffect(() => {
    if (!loadError || offlineReferenceWords.length) return;
    let active = true;
    void import("./reference-vocabulary").then(({ referenceVocabulary }) => {
      if (active) setOfflineReferenceWords(referenceVocabulary);
    });
    return () => { active = false; };
  }, [loadError, offlineReferenceWords.length]);

  useEffect(() => {
    if (!apiUrl) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setLoadError("");
      try {
        const params = new URLSearchParams({
          limit: String(pageSize),
          offset: String(offset),
        });
        if (search.trim()) params.set("q", search.trim());
        if (category !== "All words") params.set("category", category);
        const response = await fetch(`${apiUrl}/v1/words?${params}`, {
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Could not load vocabulary.");
        const result = (await response.json()) as {
          words: Array<Omit<KoreanWord, "id" | "example" | "exampleTranslation"> & {
            id?: string;
            example?: string | null;
            exampleTranslation?: string | null;
          }>;
          total: number;
        };
        const loaded = result.words.map((word) => ({
          ...word,
          id: word.id ?? `dictionary-${word.korean}`,
          example: word.example ?? "",
          exampleTranslation: word.exampleTranslation ?? undefined,
          reviewStatus: word.reviewStatus ?? "unreviewed",
        }));
        setRemoteWords((current) =>
          offset === 0
            ? loaded
            : [
                ...current,
                ...loaded.filter(
                  (word) => !current.some((item) => item.korean === word.korean),
                ),
              ],
        );
        setRemoteTotal(result.total);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setLoadError("Could not load the word bank. Check your connection and try again.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [apiUrl, category, offset, search]);

  const matchesFilter = (word: KoreanWord) => {
    const matchesCategory =
      category === "All words" || word.category === category;
    const query = search.trim().toLocaleLowerCase();
    return (collection === "all" || learnedWords.includes(word.korean)) && matchesCategory && (!query ||
      `${word.korean} ${word.romanization} ${word.meaning}`
        .toLocaleLowerCase()
        .includes(query));
  };
  const localWords = [
    ...wordBank,
    ...additionalVocabulary,
    ...hangulLetters,
    ...offlineReferenceWords,
  ].filter(matchesFilter);
  const visibleRemote = remoteWords.filter(matchesFilter);
  // Remote source and review metadata should remain visible for overlapping
  // headwords. Local records still provide the complete offline fallback.
  const filtered = [...new Map(
    [...localWords, ...visibleRemote].map((word) => [word.korean, word]),
  ).values()];

  return (
    <div className="content-page words-page">
      <div className="page-intro words-intro">
        <h2>Your growing word bank</h2>
        <p>
          Find a word, explore its meaning, and practice related words by topic. Source links and review notes are available with each entry.
          Tap a word to hear it.
        </p>
      </div>
      <WordPacks/>
      <label className="word-search">
        <span className="sr-only">Search Korean words</span>
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setOffset(0);
            setRemoteWords([]);
            setRemoteTotal(0);
          }}
          placeholder="Search Korean, romanization, or meaning"
        />
      </label>
      <div className="collection-tabs" role="group" aria-label="Word collection"><button type="button" aria-pressed={collection === "all"} onClick={() => setCollection("all")}>Explore all words</button><button type="button" aria-pressed={collection === "learned"} onClick={() => setCollection("learned")}>Words from your lessons · {new Set(learnedWords).size}</button></div>
      <div
        className="word-filters"
        role="group"
        aria-label="Filter vocabulary category"
      >
        {["All words", ...wordCategories].map((item) => (
          <button
            key={item}
            className={category === item ? "active" : ""}
            onClick={() => {
              if (item === category) return;
              setCategory(item);
              setOffset(0);
              setRemoteWords([]);
              setRemoteTotal(0);
            }}
            aria-pressed={category === item}
          >
            {item}
          </button>
        ))}
      </div>
      <p className="word-count" aria-live="polite">
        {filtered.length} unique words shown
      </p>
      {loadError && <p className="word-load-error" role="alert">{loadError}</p>}
      {loading && remoteWords.length === 0 && <>
        <p className="word-loading-label" role="status">Syncing the connected word bank…</p>
        <div className="word-loading" aria-busy="true" aria-label="Loading dictionary entries">
          {Array.from({ length: 3 }, (_, index) => <div className="word-loading-card" key={index}><i /><i /><i /></div>)}
        </div>
      </>}
      <div className="word-grid">
        {filtered.map((word) => (
          <article className="word-card" key={word.id}>
            <span className="word-category">{word.category}</span>
            <strong lang="ko">{word.korean}</strong>
            <span className="word-roman">{word.romanization}</span>
            <span className="word-meaning">{word.meaning}</span>
            <span className="word-example" lang="ko">
              {word.example}
              {word.exampleTranslation && (
                <span className="word-example-translation" lang="en">
                  {word.exampleTranslation}
                </span>
              )}
            </span>
            <WordReference word={word.korean} source={word.source} license={word.license} reviewStatus={word.reviewStatus} />
            <button
              className="word-audio"
              onClick={() => onHear(word.korean)}
              aria-label={`Hear ${word.korean}`}
            >
              <SpeakerHigh size={16} /> Hear it
            </button>
          </article>
        ))}
        {!filtered.length && (
          <p className="word-empty">
            No words match that search. Try a shorter word.
          </p>
        )}
      </div>
      {remoteWords.length < remoteTotal && (
        <button
          className="button button-quiet word-load-more"
          onClick={() => setOffset((current) => current + pageSize)}
          disabled={loading}
        >
          {loading ? "Loading…" : "Load more words"}
        </button>
      )}
      <p className="word-credit">
        Community dictionary entries are adapted from cc-kedict: Creative Commons Korean-English Dictionary by Michael Hagiwara and cc-kedict contributors, based largely on English Wiktionary. Original Saegim vocabulary is dedicated to the public domain under CC0 1.0.{" "}
        <a href="https://github.com/mhagiwara/cc-kedict" target="_blank" rel="noreferrer">
          View the source
        </a>
        . Entries are selected and reformatted for Saegim and distributed under{" "}
        <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">
          CC BY-SA 3.0
        </a>
        ; adaptations retain the same license. Local reference cards await editor review.
      </p>
    </div>
  );
}

function ReviewView({
  progress,
  onReview,
  onPractice,
  onMissed,
  onLesson,
}: {
  progress: SavedProgress;
  onReview: () => void;
  onPractice: () => void;
  onMissed: () => void;
  onLesson: () => void;
}) {
  const due = dueReviewItems(progress);
  const overview = reviewOverview(progress.reviewItems);
  const nextDue = [...progress.reviewItems].sort((left, right) =>
    left.dueAt.localeCompare(right.dueAt),
  )[0];
  const hasLesson = progress.completed > 0;
  return (
    <div className="review-page">
      <div className="review-page-intro">
        <div className="review-page-icon">
          <Lightning size={24} weight="fill" />
        </div>
        <div>
          <h2>
            {!hasLesson ? (
              <>
                Your first review
                <br />
                starts with a lesson.
              </>
            ) : due.length ? (
              <>
                A few things are ready
                <br />
                for a little revisit.
              </>
            ) : (
              <>
                You’re all caught up
                <br />
                for now.
              </>
            )}
          </h2>
          <p>
            {!hasLesson
              ? "Finish Hello, Hangul to add your first cards. They’ll come back for review over time."
              : due.length
                ? "Try to remember before you peek. A tiny bit of effort helps it stick."
                : "Your cards return over time, so what you learned has room to settle."}
          </p>
        </div>
      </div>
      <section className="review-health" aria-label="Your review collection">
        <div><strong>{overview.total}</strong><span>saved cards</span></div>
        <div><strong>{overview.recovery}</strong><span>marked Again</span></div>
        <div><strong>{overview.established}</strong><span>recalled 3+ times in a row</span></div>
        <p>Missed cards come first, then the oldest review dates. Repeated recall is practice history, not a mastery score.</p>
      </section>
      <div className="review-queue">
        <div>
          <span className="queue-count">
            {String(due.length).padStart(2, "0")}
          </span>
          <span>
            <strong>{due.length ? "Due for review" : "Cards due now"}</strong>
            <small>
              {due.length
                ? `About ${Math.max(1, Math.ceil(due.length * 0.4))} minutes`
                : nextDue
                  ? `Next card ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(nextDue.dueAt))}`
                  : "Complete a lesson to begin"}
            </small>
          </span>
        </div>
        <div className="queue-examples">
          {(due.length
            ? due.slice(0, 4).map((item) => item.front)
            : ["ㄱ", "ㅏ", "가"]
          ).map((word, index) => (
            <span key={`${word}-${index}`}>{word}</span>
          ))}
        </div>
        <button
          className="button button-dark"
          onClick={due.length ? onReview : onLesson}
          disabled={hasLesson && !due.length}
        >
          {due.length ? (
            <>
              Start a quick review <ArrowRight size={17} />
            </>
          ) : !hasLesson ? (
            <>
              Start your first lesson <ArrowRight size={17} />
            </>
          ) : (
            "No cards due yet"
          )}
        </button>
      </div>
      {progress.reviewItems.length > 0 && <section className="recovery-practice"><div><span className="micro-label">KEEP YOUR WORDS CLOSE</span><h3>A little practice, whenever you like.</h3><p>Revisit up to 10 saved cards, even when nothing is due. Your ratings update their next review dates.</p></div><button className="button button-soft" onClick={onPractice}>Practice saved cards <ArrowRight size={17} /></button></section>}
      {overview.recovery > 0 && <section className="recovery-practice"><div><span className="micro-label">A FOCUSED SECOND CHANCE</span><h3>Give the tricky ones another go.</h3><p>{overview.recovery} cards marked Again, ready to practice whenever you choose.</p></div><button type="button" className="button button-dark" onClick={onMissed}>Practice missed cards</button></section>}
      <div className="review-footnote">
        You’ve marked cards remembered <strong>{progress.reviewsDone}</strong> times so far.
        Getting one wrong is part of learning.
      </div>
    </div>
  );
}

