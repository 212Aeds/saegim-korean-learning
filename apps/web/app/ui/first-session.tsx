import type {Lesson} from "../curriculum";
import type {starterJourney} from "../first-session";
import styles from "./first-session.module.css";

export function FirstSession({journey,onLesson,onShowDashboard}:{journey:NonNullable<ReturnType<typeof starterJourney>>;onLesson:(lesson:Lesson)=>void;onShowDashboard:()=>void}){
 const next=journey.nextLesson;
 return <section className={styles.welcome} aria-labelledby="first-session-title">
  <span className="micro-label">YOUR STARTING POINT</span><h2 id="first-session-title">Your first steps in Korean.</h2>
  <p className={styles.intro}>No Korean knowledge needed. Start with letter shapes and sounds; each lesson introduces its topic before you practice.</p>
  <div className={styles.next}><span className="micro-label">{journey.completed?"UP NEXT":"START HERE"} · ABOUT {next.minutes} MINUTES</span><h3>{next.title}</h3><p>{next.briefing?.focus??next.detail}</p><button type="button" className="button button-dark" onClick={()=>onLesson(next)}>{journey.completed?"Continue to the next lesson":"Start my first lesson"}</button><p className={styles.note}>Listen again whenever you need to. These lessons use choice and typing questions; no microphone is required.</p></div>
  <h3>Your first three lessons</h3><ol className={styles.steps}>{journey.steps.map(({lesson,complete},index)=><li key={lesson.id} aria-current={lesson.id===next.id?"step":undefined}><span className={styles.number} aria-hidden="true">{complete?"✓":index+1}</span><div><strong>{lesson.title}</strong><p>{lesson.detail}</p><span className={styles.note}>{complete?"Completed":lesson.id===next.id?"Ready to start":"Later in your route"}</span></div></li>)}</ol>
  {journey.completed>0&&<aside className={styles.feedback}><h3>How did the first lesson feel?</h3><p>What became clearer, and where did you get stuck? Your feedback can help improve the beta.</p><a href="/feedback/">Share optional feedback</a><p className={styles.note}>You can continue learning without sending anything.</p></aside>}
  <div className={styles.footer}><button type="button" className="button button-quiet" onClick={onShowDashboard}>Show the full Today dashboard</button><p className={styles.note}>Learn, Review and the other sections are still available in navigation. Your progress stays saved when you take a break.</p></div>
 </section>;
}
