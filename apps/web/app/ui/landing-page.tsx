"use client";

import {
  ArrowRight,
  BookOpenText,
  CheckCircle,
  SpeakerHigh,
  Sparkle,
} from "./icons";
import { useEffect, useState } from "react";
import {playKorean,stopKoreanPlayback} from "./speech";
import { SoriMascot } from "./sori-mascot";
import { lessons } from "../curriculum";

export function LandingPage({
  onCreateAccount,
  onSignIn,
  freeMode = false,
}: {
  onCreateAccount: () => void;
  onSignIn: () => void;
  freeMode?: boolean;
}) {
  const [samplePlaying,setSamplePlaying]=useState(false);
  const [sampleNotice,setSampleNotice]=useState("");
  useEffect(()=>()=>stopKoreanPlayback(),[]);
  async function hearHello(){setSamplePlaying(true);setSampleNotice("");try{const result=await playKorean("안녕하세요",{waitForEnd:true});if(!result.played)setSampleNotice("Audio is unavailable right now. Try again shortly.");}finally{setSamplePlaying(false);}}
  return (
    <div className="landing-page">
      <a className="skip-learning-link" href="#your-path">Skip to learning path</a>
      <header className="landing-nav">
        <a className="landing-brand" href="#home" aria-label="Saegim home">
          <span className="landing-mark" aria-hidden="true">한</span>
          <span>saegim<span>.</span></span>
        </a>
        <div className="landing-nav-actions">
          <a className="public-nav-link" href="#your-path">Explore</a>
          <a className="public-nav-link" href="/about/">About</a>
          <span className="free-pill"><span /> Always free</span>
          {!freeMode && <button className="landing-signin" onClick={onSignIn}>Sign in</button>}
        </div>
      </header>

      <section className="landing-hero" id="home">
        <div className="landing-copy">
          <span className="micro-label"><Sparkle size={14} /> YOUR KOREAN, YOUR WAY</span>
          <h1>Korean, one<br /><em>small win at a time.</em></h1>
          <p>
            Start with the letters. Find your words. Build sentences you can use.
            A welcoming place to practice Korean, at your own pace.
          </p>
          <button className="button button-dark landing-cta" onClick={onCreateAccount}>
            {freeMode ? "Start learning for free" : "Create your free account"} <ArrowRight size={17} weight="bold" />
          </button>
          <span className="landing-note">{freeMode ? "No sign-up. No subscription. Your progress stays on this device." : "A free account keeps your lessons and reviews together."}</span>
        </div>
        <div className="landing-art" aria-label="The Korean syllable 한, one small beginning">
          <span className="landing-orbit orbit-one" />
          <span className="landing-orbit orbit-two" />
          <span className="landing-sun" />
          <span className="landing-syllable" lang="ko">한</span>
          <span className="landing-art-note">one small beginning</span>
          <button type="button" className="landing-mini-card" disabled={samplePlaying} aria-label={samplePlaying ? "Playing hello in Korean" : "Hear hello in Korean"} onClick={()=>void hearHello()}>
            <span className="landing-mini-icon"><SpeakerHigh size={15} /></span>
            <span><strong>안녕하세요</strong><small>{samplePlaying ? "Playing…" : "annyeonghaseyo · tap to listen"}</small></span>
          </button>
          {sampleNotice && <p className="landing-sample-notice" role="status">{sampleNotice}</p>}
          <div className="landing-mascot-card">
            <SoriMascot className="landing-mascot" />
            <span><strong>Meet Saegim</strong><small>Your Korean learning companion</small></span>
          </div>
        </div>
      </section>

      <div className="public-course-facts" aria-label="What you can explore"><span><strong>{lessons.length}</strong> lessons to explore</span><span><strong>5</strong> starting levels</span><span><strong>Your pace</strong> always</span></div>

      <section className="landing-promises" aria-label="How Saegim helps you learn">
        <article>
          <BookOpenText size={20} />
          <div><strong>Come back to what you learn</strong><span>Recall, write, and revisit earlier words.</span></div>
        </article>
        <article>
          <CheckCircle size={20} />
          <div><strong>Every lesson stays free</strong><span>No trials, paywalls, or premium vocabulary.</span></div>
        </article>
        <article>
          <SpeakerHigh size={20} />
          <div><strong>Speak one step at a time</strong><span>Listen, learn the pattern, and say it yourself.</span></div>
        </article>
      </section>
      <section className="public-path" id="your-path" aria-labelledby="public-path-title">
        <div className="public-section-heading"><span className="micro-label">A PATH THAT MEETS YOU WHERE YOU ARE</span><h2 id="public-path-title">From your first letter<br />to your next conversation.</h2><p>Brand new, returning, or ready to stretch? Choose your starting point and interests. Change them whenever you like.</p></div>
        <div className="public-path-grid">{[
          ["01", "ㄱ · ㅏ · 가", "Find your foundations", "Meet Hangul shapes and sounds before tackling whole words."],
          ["02", "WORDS → SENTENCES", "Make Korean useful", "Explore everyday themes, sentence patterns, and writing practice."],
          ["03", "RECALL · REVISIT", "Keep a little more", "Turn your lessons into review cards. Give tricky answers another try."],
        ].map(([number, sample, title, text]) => <article key={number}><span className="public-step-number">{number}</span><div className="public-path-sample" aria-hidden="true">{sample}</div><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>
      <section className="public-invitation"><SoriMascot /><div><span className="micro-label">MAKE A LITTLE ROOM FOR KOREAN</span><h2>Five minutes is a place to start.</h2><p>Choose a daily rhythm that fits your life. Your completed lessons stay with you when you take a break.</p></div><button className="button button-dark" onClick={onCreateAccount}>Find my starting point <ArrowRight size={16} /></button></section>
      <section className="public-faq" aria-labelledby="public-faq-title"><div><span className="micro-label">BEFORE YOU BEGIN</span><h2 id="public-faq-title">A few helpful answers.</h2></div><div>{[
        ["Do I need to know Hangul?", "No. Choose “brand new” and start with letters and syllable blocks. If you already know some Korean, choose a suitable starting level."],
        ["Is it free?", "Yes. The lessons, review cards, word collection, and practice in this version are available without a subscription."],
        ["Where is my progress saved?", freeMode ? "In this browser on this device. It does not sync between devices. Clearing site data or using private browsing can remove progress. Download your learning data from Account before clearing it; automatic backup import is not available yet." : "Your signed-in account keeps your progress together. You can download your learning data from Account."],
        ["Can I listen to Korean?", "Hangul letter names and selected phrases include recorded Chris and Jessica audio. Other items use the available speech service or a supported Korean device voice. Reading and writing practice remain available when audio is unavailable."],
        ["How can I check a word or report a problem?", "Open References beside a learning item to compare dictionary sources. Lessons and examples are still undergoing editorial review. About & feedback links to our public issue tracker; please keep personal information out of reports."],
      ].map(([question,answer])=><details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
      <footer className="landing-footer">
        <span><a href="/privacy/">Privacy</a> · <a href="/about/">About & feedback</a></span>
        <span>Built for curious learners, including people reconnecting with Korean.</span>
        <span>한국어, 한 걸음씩 · Korean, one step at a time.</span>
      </footer>
    </div>
  );
}
