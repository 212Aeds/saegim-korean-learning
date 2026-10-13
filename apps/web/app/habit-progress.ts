import { localDateKey, type SavedProgress } from "./progress";
export function habitProgress(
  progress: Pick<SavedProgress, "activityDates">,
  date = new Date(),
) {
  const today = localDateKey(date),
    yesterdayDate = new Date(date);
  yesterdayDate.setDate(date.getDate() - 1);
  const yesterday = localDateKey(yesterdayDate);
  const dates = [
    ...new Set(
      progress.activityDates.filter(
        (day) => /^\d{4}-\d{2}-\d{2}$/.test(day) && day <= today,
      ),
    ),
  ].sort();
  const known = new Set(dates);
  let current = 0,
    best = 0,
    run = 0;
  const cursor = new Date(date);
  if (!known.has(today)) cursor.setDate(cursor.getDate() - 1);
  while (known.has(localDateKey(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }
  for (let i = 0; i < dates.length; i++) {
    const next = new Date(`${dates[i]}T12:00:00`);
    next.setDate(next.getDate() - 1);
    run = i > 0 && localDateKey(next) === dates[i - 1] ? run + 1 : 1;
    best = Math.max(best, run);
  }
  const goals = [3, 7, 14, 30, 60, 90];
  const nextGoal =
    goals.find((goal) => goal > current) ?? Math.ceil((current + 1) / 30) * 30;
  return {
    current,
    best,
    total: dates.length,
    nextGoal,
    studiedToday: known.has(today),
    atRisk: known.has(yesterday) && !known.has(today),
    milestones: goals.map((days) => ({ days, earned: best >= days })),
  };
}
