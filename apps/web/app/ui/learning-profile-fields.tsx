"use client";
import type { LearningProfile } from "../learning-profile";
export function LearningProfileFields({
  profile,
  onChange,
}: {
  profile: LearningProfile;
  onChange: (profile: LearningProfile) => void;
}) {
  return (
    <fieldset className="learning-profile-fields">
      <legend>Your Korean journey</legend>
      <label>
        Where are you starting?
        <select
          value={profile.level}
          onChange={(event) =>
            onChange({
              ...profile,
              level: event.target.value as LearningProfile["level"],
            })
          }
          required
        >
          <option value="new">I’m brand new to Korean</option>
          <option value="hangul">I can read Hangul</option>
          <option value="basic">I know basic words; I’m building sentences</option>
          <option value="intermediate">I can have basic conversations</option><option value="advanced">I can discuss opinions and connect ideas</option>
        </select>
      </label>
      <span>What brings you here? Choose one or more.</span>
      {(
        [
          ["family", "Family and heritage"],
          ["travel", "Travel and everyday situations"],
          ["culture", "Music, shows, and curiosity"],
          ["work-study", "Work or study"],
          ["friends", "Friends and relationships"], ["food", "Food and cooking"], ["living", "Living in Korea"], ["exams", "TOPIK and study goals"],
        ] as const
      ).map(([reason, label]) => (
        <label className="profile-reason" key={reason}>
          <input
            type="checkbox"
            checked={profile.reasons.includes(reason)}
            onChange={(event) =>
              onChange({
                ...profile,
                reasons: event.target.checked
                  ? [...profile.reasons, reason]
                  : profile.reasons.filter((item) => item !== reason),
              })
            }
          />
          {label}
        </label>
      ))}
      <label>
        How much would you like to practice each day?
        <select
          value={profile.dailyMinutes ?? 15}
          onChange={(event) =>
            onChange({
              ...profile,
              dailyMinutes: Number(
                event.target.value,
              ) as LearningProfile["dailyMinutes"],
            })
          }
        >
          {[5, 10, 15, 20, 30, 45, 60].map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} minutes a day
            </option>
          ))}
        </select>
      </label>
      <small>
        Your choices guide recommendations. They don’t mark lessons completed,
        and you can change them later.
      </small>
    </fieldset>
  );
}
