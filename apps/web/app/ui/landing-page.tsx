"use client";

import {
  ArrowRight,
  BookOpenText,
  CheckCircle,
  SpeakerHigh,
  Sparkle,
} from "./icons";
import { SoriMascot } from "./sori-mascot";

export function LandingPage({
  onCreateAccount,
  onSignIn,
}: {
  onCreateAccount: () => void;
  onSignIn: () => void;
}) {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <a className="landing-brand" href="#home" aria-label="Saegim home">
          <span className="landing-mark" aria-hidden="true">한</span>
          <span>saegim<span>.</span></span>
        </a>
        <div className="landing-nav-actions">
          <span className="free-pill"><span /> Always free</span>
          <button className="landing-signin" onClick={onSignIn}>Sign in</button>
        </div>
      </header>

      <section className="landing-hero" id="home">
        <div className="landing-copy">
          <span className="micro-label"><Sparkle size={14} /> YOUR KOREAN, YOUR WAY</span>
          <h1>Make room for<br /><em>one more word.</em></h1>
          <p>
            Learn Hangul, build real sentences, and keep the words you meet.
            Small, thoughtful practice — free, for as long as you like.
          </p>
          <button className="button button-dark landing-cta" onClick={onCreateAccount}>
            Create your free account <ArrowRight size={17} weight="bold" />
          </button>
          <span className="landing-note">A free account keeps your lessons and reviews together.</span>
        </div>
        <div className="landing-art" aria-label="The Korean syllable 한, one small beginning">
          <span className="landing-orbit orbit-one" />
          <span className="landing-orbit orbit-two" />
          <span className="landing-sun" />
          <span className="landing-syllable" lang="ko">한</span>
          <span className="landing-art-note">one small beginning</span>
          <span className="landing-mini-card">
            <span className="landing-mini-icon"><SpeakerHigh size={15} /></span>
            <span><strong>안녕하세요</strong><small>annyeonghaseyo · hello</small></span>
          </span>
          <div className="landing-mascot-card">
            <SoriMascot className="landing-mascot" />
            <span><strong>Meet Saegim</strong><small>Your Korean learning companion</small></span>
          </div>
        </div>
      </section>

      <section className="landing-promises" aria-label="How Saegim helps you learn">
        <article>
          <BookOpenText size={20} />
          <div><strong>Practice that sticks</strong><span>Recall, write, and revisit words at the right time.</span></div>
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
      <footer className="landing-footer">
        <span>Built for curious learners, including people reconnecting with Korean.</span>
        <span>한국어, 한 걸음씩 · Korean, one step at a time.</span>
      </footer>
    </div>
  );
}
