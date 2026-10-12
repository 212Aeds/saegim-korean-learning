"use client";
import type { LearningProfile } from "../learning-profile";
export function LearningProfileFields({ profile, onChange }: { profile: LearningProfile; onChange: (profile: LearningProfile) => void }) {
  return <fieldset className="learning-profile-fields"><legend>Your Korean journey</legend>
    <label>Where are you starting?<select value={profile.level} onChange={(event) => onChange({ ...profile, level: event.target.value as LearningProfile["level"] })} required>
      <option value="new">I’m brand new to Korean</option><option value="hangul">I can read Hangul</option><option value="basic">I know some words and simple sentences</option><option value="intermediate">I can have basic conversations</option>
    </select></label>
    <span>What brings you here? Choose one or more.</span>
    {([['family', 'Family and heritage'], ['travel', 'Travel and everyday situations'], ['culture', 'Music, shows, and curiosity'], ['work-study', 'Work or study']] as const).map(([reason, label]) => <label className="profile-reason" key={reason}><input type="checkbox" checked={profile.reasons.includes(reason)} onChange={(event) => onChange({ ...profile, reasons: event.target.checked ? [...profile.reasons, reason] : profile.reasons.filter((item) => item !== reason) })} />{label}</label>)}
    <small>Your choices guide recommendations. They don’t mark lessons completed, and you can change them later.</small>
  </fieldset>;
}
