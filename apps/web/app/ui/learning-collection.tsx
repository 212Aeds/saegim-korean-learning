import { lessons } from "../curriculum";
import { journeyTopics } from "../journey-content";
import { learningPathways, pathwayProgress } from "../learning-pathways";

export function LearningCollection({ completed }: { completed: string[] }) {
  const learned = new Set(completed.filter((id) => lessons.some((lesson) => lesson.id === id)));
  const nextMilestone = [5, 10, 25, 50, lessons.length].find((count) => count > learned.size);
  const topics = journeyTopics.filter((topic) => ["words", "dialogue", "consolidation"].every((part) => learned.has(`${topic.id}-${part}`)));
  return <section className="learning-collection" aria-label="Your learning collection">
    <div className="collection-heading"><div><span className="micro-label">YOUR LEARNING COLLECTION</span><h3>Small steps. Something to keep.</h3></div><strong>{learned.size}<small>lessons completed</small></strong></div>
    <p>{nextMilestone ? `${nextMilestone - learned.size} more lessons to your ${nextMilestone}-lesson milestone.` : "You’ve completed the current course collection. Keep it fresh with review and conversation."} Placement opens a starting point; only completed lessons fill this collection.</p>
    <div className="collection-pathways">{learningPathways.map((pathway) => { const stats = pathwayProgress(pathway.id, [...learned]); return <div key={pathway.id}><span>{pathway.title}</span><progress max={stats.total} value={stats.completed} aria-label={`${pathway.title}: ${stats.completed} of ${stats.total} completed`} /><small>{stats.completed}/{stats.total}</small></div>; })}</div>
    <div className="collection-topics"><span className="micro-label">TOPICS PUT INTO PRACTICE</span>{topics.length ? topics.map((topic) => <span className="topic-seal" key={topic.id}>✓ {topic.title}</span>) : <p>Finish a topic’s words, exchanges, and consolidation lesson to collect its chapter.</p>}</div>
  </section>;
}
