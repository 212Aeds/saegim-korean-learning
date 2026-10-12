import { localDateKey } from "./progress";
import type { LearningProfile } from "./learning-profile";
export const avatars = { sprout: "🌱", cat: "🐱", star: "⭐", moon: "🌙" };
export function accountAvatar(profile?: LearningProfile) { return avatars[profile?.avatar ?? "sprout"]; }
export function weeklyProgress(dates: string[], goal: number, date = new Date()) {
  const start = new Date(date);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const first = localDateKey(start), today = localDateKey(date);
  const studied = new Set(dates.filter((day) => day >= first && day <= today)).size;
  return { studied, goal, remaining: Math.max(0, goal - studied), complete: studied >= goal };
}
