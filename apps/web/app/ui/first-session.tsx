import type {Lesson} from "../curriculum";
import type {starterJourney} from "../first-session";
import styles from "./first-session.module.css";
import {StudyIllustration} from "./study-illustration";

export function FirstSession({journey,onLesson,onShowDashboard,missedCount=0,onMissed,onRecap}:{journey:NonNullable<ReturnType<typeof starterJourney>>;onLesson:(lesson:Lesson)=>void;onShowDashboard:()=>void;missedCount?:number;onMissed?:()=>void;onRecap?:()=>void}){
 const next=journey.nextLesson;
 return <section className={`${styles.welcome} today-first-session`} aria-labelledby="first-session-title">
  <h2 id="first-session-title" className="sr-only">Your first steps in Korean.</h2>
  <p className={styles.intro}>No Korean knowledge needed. Start with letter shapes and sounds; each lesson introduces its topic before you practice.</p>
  <div className={`${styles.next} today-recommended-lesson`}><StudyIllustration/><span className="micro-label">{journey.completed?"UP NEXT":"START HERE"} · ABOUT {next.minutes} MINUTES</span><h3>{next.title}</h3><p>{next.briefing?.focus??next.detail}</p><button type="button" className="button button-dark" onClick={()=>onLesson(next)}>{journey.completed?"Continue to the next lesson":"Start my first lesson"}</button><p className={styles.note}>Listen again whenever you need to. These lessons use choice and typing questions; no microphone is required.</p></div>
  <h3>Your first three lessons</h3><ol className={styles.steps}>{journey.steps.map(({lesson,complete},index)=><li key={lesson.id} aria-current={lesson.id===next.id?"step":undefined}><span className={styles.number} aria-hidden="true">{complete?"✓":index+1}</span><div><strong>{lesson.title}</strong><p>{lesson.detail}</p><span className={styles.note}>{complete?"Completed":lesson.id===next.id?"Ready to start":"Later in your route"}</span></div></li>)}</ol>
  {missedCount>0&&<aside className={styles.feedback}><h3>{missedCount} {missedCount===1?'question':'questions'} to revisit</h3><p>Practice up to five missed questions. No new material is added.</p><button className="button button-quiet" onClick={onMissed}>Practice my mistakes</button></aside>}
  {journey.completed>0&&<button className="text-link" onClick={onRecap}>Open my learning recap</button>}
  {journey.completed>0&&<aside className={styles.feedback}><h3>How did the first lesson feel?</h3><p>What became clearer, and where did you get stuck? Your feedback can help improve the beta.</p><a href="/feedback/">Share optional feedback</a><p className={styles.note}>You can continue learning without sending anything.</p></aside>}
  <div className={styles.footer}><button type="button" className="button button-quiet" onClick={onShowDashboard}>Show the full Today dashboard</button><p className={styles.note}>Learn, Review and the other sections are still available in navigation. Your progress stays saved when you take a break.</p></div>
 </section>;
}
