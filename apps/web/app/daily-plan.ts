import { lessons } from "./curriculum";
import { isLessonUnlocked } from "./learning-pathways";
import { dueReviewItems, localDateKey, type SavedProgress } from "./progress";
export function dailyPlan(progress: SavedProgress, date = new Date()) {
  const daily = progress.dailyPractice.date === localDateKey(date) ? progress.dailyPractice : { lessons: [], reviews: [], speaking: [] };
  const availableLessons = lessons.filter((lesson) => !progress.completedLessonIds.includes(lesson.id) && isLessonUnlocked(lesson, progress.completedLessonIds));
  return {
    daily, revisit: availableLessons.length === 0,
    lessonGoal: Math.min(Math.max(1, Math.ceil(progress.dailyGoalMinutes / 20)), Math.max(1, availableLessons.length + daily.lessons.length)),
    reviewGoal: Math.min(20, Math.max(3, Math.ceil(progress.dailyGoalMinutes / 3)), dueReviewItems(progress, date).length + daily.reviews.length),
    speakingGoal: progress.dailyGoalMinutes >= 15 ? Math.ceil(progress.dailyGoalMinutes / 20) : 0,
  };
}
