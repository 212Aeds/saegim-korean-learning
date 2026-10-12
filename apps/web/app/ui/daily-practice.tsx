"use client";
import type { LearningProfile } from "../learning-profile";
import { useState } from "react";
import { type SavedProgress } from "../progress";
import { SoriMascot } from "./sori-mascot";
import { dailyPlan } from "../daily-plan";

export function DailyPractice({
  progress,
  profile,
  onLesson,
  onReview,
  onSpeak,
}: {
  profile?: LearningProfile;
  progress: SavedProgress;
  onLesson: () => void;
  onReview: () => void;
  onSpeak: () => void;
}) {
  const [selectedBadge, setSelectedBadge] = useState<number | null>(null);
  const requirements = [
    "Complete your first lesson.",
    "Complete 20 review ratings.",
    "Practice 5 different speaking cards.",
    "Learn on 3 consecutive days.",
  ];
  const { daily, revisit, lessonGoal, reviewGoal, speakingGoal } = dailyPlan(
    progress,
    new Date(),
    profile,
  );
  const tasks = [
    {
      label: `${revisit ? "Revisit" : "Complete"} ${lessonGoal} lesson${lessonGoal === 1 ? "" : "s"}`,
      value: daily.lessons.length,
      goal: lessonGoal,
      action: onLesson,
    },
    ...(reviewGoal
      ? [
          {
            label: `Review ${reviewGoal} different cards`,
            value: daily.reviews.length,
            goal: reviewGoal,
            action: onReview,
          },
        ]
      : []),
    ...(speakingGoal
      ? [
          {
            label: `Practice ${speakingGoal} speaking concept${speakingGoal === 1 ? "" : "s"}`,
            value: daily.speaking.length,
            goal: speakingGoal,
            action: onSpeak,
          },
        ]
      : []),
  ];
  const complete = tasks.every((task) => task.value >= task.goal);
  const completedTasks = tasks.filter((task) => task.value >= task.goal).length;
  const milestones = [
    { label: "First steps", earned: progress.completedLessonIds.length >= 1 },
    { label: "Recall explorer", earned: progress.reviewsDone >= 20 },
    {
      label: "Finding your voice",
      earned: progress.speakingCardIds.length >= 5,
    },
    { label: "Growing habit", earned: progress.streak >= 3 },
  ];
  return (
    <section className="daily-practice" aria-label="Your daily practice plan">
      <div className="daily-practice-heading">
        <div>
          <span className="micro-label">TODAY’S LITTLE QUEST</span>
          <h3>
            {complete
              ? "Your practice sprout is blooming!"
              : "Give your Korean a little room to grow."}
          </h3>
          <p>
            {complete
              ? "You completed today’s mix. Come back tomorrow for fresh recall, or keep exploring at your own pace."
              : "Longer goals add new lessons, more recall, and speaking practice. Every achievement stays free."}
          </p>
        </div>
        <SoriMascot className="daily-mascot" thumbsUp={complete} />
      </div>
      <progress
        value={completedTasks}
        max={tasks.length}
        aria-label="Daily practice activities completed"
      />
      <div className="daily-task-list">
        {tasks.map((task) => (
          <button
            key={task.label}
            type="button"
            onClick={task.action}
            className={task.value >= task.goal ? "complete" : ""}
          >
            <span>
              {task.value >= task.goal ? "✓" : "○"} {task.label}
            </span>
            <strong>
              {Math.min(task.value, task.goal)}/{task.goal}
            </strong>
          </button>
        ))}
      </div>
      <p className="daily-practice-note">
        Your time goal is a guide. Completing different activities grows your
        sprout; leaving a page open doesn’t.
      </p>
      <div className="milestone-row" aria-label="Learning milestones">
        {milestones.map((badge, index) => (
          <button
            type="button"
            aria-pressed={selectedBadge === index}
            onClick={() =>
              setSelectedBadge(selectedBadge === index ? null : index)
            }
            key={badge.label}
            className={badge.earned ? "earned" : ""}
            aria-label={`${badge.label}: ${badge.earned ? "earned" : "in progress"}`}
          >
            {badge.earned ? "✦" : "○"} {badge.label}
          </button>
        ))}
      </div>
      {selectedBadge !== null && (
        <div className="milestone-detail lesson-step-motion" role="status">
          <strong>
            {milestones[selectedBadge].label} ·{" "}
            {milestones[selectedBadge].earned
              ? "Earned"
              : "Your next achievement"}
          </strong>
          <p>{requirements[selectedBadge]}</p>
          <button
            className="button button-quiet"
            onClick={
              selectedBadge === 2
                ? onSpeak
                : selectedBadge === 1
                  ? onReview
                  : onLesson
            }
          >
            Keep growing →
          </button>
        </div>
      )}
    </section>
  );
}
