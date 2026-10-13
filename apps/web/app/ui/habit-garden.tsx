"use client";
import type { SavedProgress } from "../progress";
import { habitProgress } from "../habit-progress";
export function HabitGarden({
  progress,
  onPractice,
}: {
  progress: SavedProgress;
  onPractice: () => void;
}) {
  const habit = habitProgress(progress);
  const stage =
    habit.total >= 30
      ? "Your learning tree"
      : habit.total >= 14
        ? "A growing sapling"
        : habit.total >= 7
          ? "Your steady sprout"
          : "A small beginning";
  return (
    <section
      className="habit-garden"
      aria-label="Your learning streak and growth"
    >
      <div>
        <span className="micro-label">
          GROW SOMETHING, ONE STUDY DAY AT A TIME
        </span>
        <h3>{stage}</h3>
        <p>
          {habit.studiedToday
            ? "Today’s practice is saved. Your streak has room to keep growing."
            : habit.atRisk
              ? "A little practice today keeps your current streak going."
              : "A fresh start counts. Complete a lesson, review, speaking card, or practice round."}
        </p>
      </div>
      <div className="habit-stats">
        <strong>
          {habit.current}
          <small>current streak</small>
        </strong>
        <strong>
          {habit.best}
          <small>best recorded run</small>
        </strong>
        <strong>
          {habit.total}
          <small>recorded study days</small>
        </strong>
      </div>
      <div
        className="habit-growth"
        aria-label={`${habit.current} of ${habit.nextGoal} days toward your next streak milestone`}
      >
        <span aria-hidden="true">
          {habit.total >= 30 ? "🌳" : habit.total >= 7 ? "🌿" : "🌱"}
        </span>
        <progress max={habit.nextGoal} value={habit.current} />
        <strong>
          {habit.nextGoal - habit.current} more consecutive days to{" "}
          {habit.nextGoal}
        </strong>
      </div>
      <div className="habit-badges">
        {habit.milestones.map((badge) => (
          <span key={badge.days} className={badge.earned ? "earned" : ""}>
            {badge.earned ? "✦" : "○"} {badge.days} days
          </span>
        ))}
      </div>
      <small>
        Milestones use recorded study dates, not page visits. Best runs reflect
        your saved activity history; a missed day never removes lessons you’ve
        learned.
      </small>
      <button className="button button-dark" onClick={onPractice}>
        {habit.studiedToday ? "Keep learning at my pace" : "Grow my streak"}
      </button>
    </section>
  );
}
