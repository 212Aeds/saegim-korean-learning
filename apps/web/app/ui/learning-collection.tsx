import { lessons } from "../curriculum";
import { learningPathways, pathwayProgress, isLessonUnlocked, prerequisiteLabel } from "../learning-pathways";
import { chapterProgress } from "../chapter-progress";
import { defaultLearningProfile, placementKnowledge, type LearningProfile } from "../learning-profile";
import type { Lesson } from "../curriculum";

export function LearningCollection({ completed, profile=defaultLearningProfile, onLesson }: { completed: string[]; profile?:LearningProfile; onLesson?:(lesson:Lesson)=>void }) {
  const learned = new Set(completed.filter((id) => lessons.some((lesson) => lesson.id === id)));
  const nextMilestone = [5, 10, 25, 50, 75, 100, lessons.length].find((count) => count > learned.size);
  const chapters=chapterProgress([...learned]), completeChapters=chapters.filter(chapter=>chapter.complete).length;
  return <section className="learning-collection" aria-label="Your learning collection">
    <div className="collection-heading"><div><span className="micro-label">YOUR LEARNING COLLECTION</span><h3>Small steps. Something to keep.</h3></div><strong>{learned.size}<small>lessons completed</small></strong></div>
    <p>{nextMilestone ? `${nextMilestone - learned.size} more lessons to your ${nextMilestone}-lesson milestone.` : "You’ve completed the current course collection. Keep it fresh with review and conversation."} Placement opens a starting point; only completed lessons fill this collection.</p>
    <div className="collection-pathways">{learningPathways.map((pathway) => { const stats = pathwayProgress(pathway.id, [...learned]); return <div key={pathway.id}><span>{pathway.title}</span><progress max={stats.total} value={stats.completed} aria-label={`${pathway.title}: ${stats.completed} of ${stats.total} completed`} /><small>{stats.completed}/{stats.total}</small></div>; })}</div>
    <details className="chapter-collection">
      <summary><span>Explore your topic chapters</span><strong>{completeChapters} / {chapters.length} complete</strong></summary>
      <div className="chapter-grid">{chapters.map(chapter=>{
        const next=lessons.find(lesson=>lesson.id===chapter.nextLessonId)!;
        const ready=isLessonUnlocked(next,completed,placementKnowledge(profile));
        return <article className={chapter.complete?"chapter-card is-complete":"chapter-card"} key={chapter.id}>
          <span className="micro-label">{chapter.complete?"CHAPTER COMPLETE":`${chapter.done} OF ${chapter.stages.length} STEPS`}</span><h4>{chapter.title}</h4>
          <progress max={chapter.stages.length} value={chapter.done} aria-label={`${chapter.title}: ${chapter.done} of ${chapter.stages.length} steps complete`} />
          <ol>{chapter.stages.map(stage=><li key={stage.id} className={stage.completed?"is-complete":""}><span aria-hidden="true">{stage.completed?"✓":"○"}</span>{stage.label}</li>)}</ol>
          {onLesson && <button type="button" className="button button-quiet" disabled={!ready} onClick={()=>onLesson(next)}>{chapter.complete?"Revisit chapter":!ready?"Earlier steps first":chapter.done?"Keep going":"Start chapter"}</button>}
          {!ready && <small className="chapter-prerequisite">{prerequisiteLabel(next,completed,placementKnowledge(profile))}</small>}
        </article>;
      })}</div>
    </details>
  </section>;
}
