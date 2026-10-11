"use client";
import { dueReviewItems, localDateKey, type SavedProgress } from "../progress";
import { SoriMascot } from "./sori-mascot";

export function DailyPractice({ progress, onLesson, onReview, onSpeak }: { progress: SavedProgress; onLesson: () => void; onReview: () => void; onSpeak: () => void }) {
  const daily = progress.dailyPractice.date === localDateKey() ? progress.dailyPractice : { lessons: [], reviews: [], speaking: [] };
  const lessonGoal = Math.max(1, Math.ceil(progress.dailyGoalMinutes / 20));
  const reviewGoal = Math.min(20, Math.max(3, Math.ceil(progress.dailyGoalMinutes / 3)), dueReviewItems(progress).length + daily.reviews.length);
  const speakingGoal = progress.dailyGoalMinutes >= 15 ? Math.ceil(progress.dailyGoalMinutes / 20) : 0;
  const tasks = [
    { label: `Complete ${lessonGoal} lesson${lessonGoal === 1 ? "" : "s"}`, value: daily.lessons.length, goal: lessonGoal, action: onLesson },
    { label: reviewGoal ? `Recall ${reviewGoal} different cards` : "Scheduled reviews caught up", value: daily.reviews.length, goal: reviewGoal, action: onReview },
    ...(speakingGoal ? [{ label: `Practice ${speakingGoal} speaking concept${speakingGoal === 1 ? "" : "s"}`, value: daily.speaking.length, goal: speakingGoal, action: onSpeak }] : []),
  ];
  const complete = tasks.every((task) => task.value >= task.goal);
  const completedTasks = tasks.filter((task) => task.value >= task.goal).length;
  const milestones = [
    { label: "First steps", earned: progress.completedLessonIds.length >= 1 },
    { label: "Recall explorer", earned: progress.reviewsDone >= 20 },
    { label: "Finding your voice", earned: progress.speakingCardIds.length >= 5 },
    { label: "Growing habit", earned: progress.streak >= 3 },
  ];
  return <section className="daily-practice" aria-label="Your daily practice plan">
    <div className="daily-practice-heading"><div><span className="micro-label">TODAY’S LITTLE QUEST</span><h3>{complete ? "Your practice sprout is blooming!" : "Give your Korean a little room to grow."}</h3><p>{complete ? "You completed today’s mix. Come back tomorrow for fresh recall, or keep exploring at your own pace." : "Longer goals add new lessons, more recall, and speaking practice. Every achievement stays free."}</p></div><SoriMascot className="daily-mascot" thumbsUp={complete} /></div>
    <progress value={completedTasks} max={tasks.length} aria-label="Daily practice activities completed" />
    <div className="daily-task-list">{tasks.map((task) => <button key={task.label} type="button" onClick={task.action} className={task.value >= task.goal ? "complete" : ""}><span>{task.value >= task.goal ? "✓" : "○"} {task.label}</span><strong>{Math.min(task.value, task.goal)}/{task.goal}</strong></button>)}</div>
    <p className="daily-practice-note">Your time goal is a guide. Completing different activities grows your sprout; leaving a page open doesn’t.</p>
    <div className="milestone-row" aria-label="Learning milestones">{milestones.map((badge) => <span key={badge.label} className={badge.earned ? "earned" : ""} aria-label={`${badge.label}: ${badge.earned ? "earned" : "in progress"}`}>{badge.earned ? "✦" : "○"} {badge.label}</span>)}</div>
  </section>;
}
