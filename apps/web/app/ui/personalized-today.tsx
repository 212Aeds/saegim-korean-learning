import type { Lesson } from "../curriculum";
import type { LearningProfile } from "../learning-profile";
import { personalizedToday } from "../personalized-today";
import styles from "./personalized-today.module.css";
import {StudyIllustration} from "./study-illustration";

export function PersonalizedToday({ profile, completed, dailyMinutes, dueCount, missedCount, onMissed, onRecap, onLesson, onReview, onSettings, onShowDashboard }: {
  missedCount:number;
  onMissed:()=>void;
  onRecap:()=>void;
  profile: LearningProfile;
  completed: string[];
  dailyMinutes: number;
  dueCount: number;
  onLesson: (lesson: Lesson) => void;
  onReview: () => void;
  onSettings: () => void;
  onShowDashboard: () => void;
}) {
  const plan = personalizedToday(profile, completed);
  const next = plan.next;
  return <section className={styles.focus} aria-labelledby="personalized-plan-title">
    <div className={`${styles.lesson} today-recommended-lesson`}><StudyIllustration/>
      <span className="micro-label">{plan.levelLabel} · {next ? "RECOMMENDED LESSON" : "YOUR PATH"}</span>
      <h2 id="personalized-plan-title">{next?.title ?? "You’ve completed the available lessons."}</h2>
      <p>{next?.briefing?.focus ?? next?.detail ?? "Revisit what you learned in Review, or explore another section whenever you like."}</p>
      {next && <>
        <p className={styles.note}>{next.category} · About {next.minutes} minutes · Based on your selected level and completed lessons.</p>
        <button type="button" className="button button-dark" onClick={() => onLesson(next)}>{completed.length ? "Continue learning" : "Start learning"}<span className="sr-only">: {next.title}</span></button>
        {next.minutes > dailyMinutes && <p className={styles.note}>This lesson is longer than your daily goal. You can take a break when you need to.</p>}
      </>}
    </div>
    <div className={styles.context}>
      <p>{plan.guidance}</p>
      <p className={styles.note}>Your interests: {plan.interests || "general Korean"}. Your practice goal: {dailyMinutes} minutes.</p>
      <button type="button" className="text-link" onClick={onSettings}>Adjust my level and goals</button>
    </div>
    {missedCount > 0 ? <div className={styles.review}><div><h3>{missedCount} {missedCount===1?'question':'questions'} to revisit</h3><p>From your lessons and cards. Practice up to five, whenever you want.</p></div><button type="button" className="button button-quiet" onClick={onMissed}>Practice my mistakes</button></div> : dueCount > 0 && <div className={styles.review}>
      <div><h3>{dueCount} {dueCount === 1 ? "card ready" : "cards ready"} to review</h3><p>Revisit material you’ve already practiced.</p></div>
      <button type="button" className="button button-quiet" onClick={onReview}>Review instead</button>
    </div>}
    {plan.alternatives.length > 0 && <details className={styles.alternatives}>
      <summary>Other lessons ready for you</summary>
      <ul>{plan.alternatives.map(lesson => <li key={lesson.id}><div><strong>{lesson.title}</strong><p>{lesson.detail}</p></div><button type="button" className="button button-quiet" onClick={() => onLesson(lesson)}>Start<span className="sr-only"> {lesson.title}</span></button></li>)}</ul>
    </details>}
    {completed.length>0&&<details className={styles.alternatives}><summary>Check what I remember</summary><p>Your optional recap quiz uses completed lessons, with no timer or streak penalty.</p><button type="button" className="button button-quiet" onClick={onRecap}>Open my learning recap</button></details>}
    <div className={styles.footer}><button type="button" className="text-link" onClick={onShowDashboard}>Show the full Today dashboard</button><p className={styles.note}>All sections remain available in navigation.</p></div>
  </section>;
}
