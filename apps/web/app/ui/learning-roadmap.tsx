"use client";
import { learningRoute, placementKnowledge, type LearningProfile } from "../learning-profile";
import { isLessonUnlocked } from "../learning-pathways";
import type { Lesson } from "../curriculum";
const levelLabels = { new: "Start with Hangul, then build useful sentences", hangul: "Start with useful words, then build sentences", basic: "Build useful words, then learn sentence patterns", intermediate: "Start with conversations, then stretch your Korean", advanced: "Connect ideas, opinions, and longer exchanges" };
export function LearningRoadmap({ profile, completed, onLesson }: { profile: LearningProfile; completed: string[]; onLesson: (lesson: Lesson) => void }) {
  const route = learningRoute(profile);
  const next = route.filter((lesson) => !completed.includes(lesson.id) && !placementKnowledge(profile).includes(lesson.id)).slice(0, 3);
  const learned = route.filter((lesson) => completed.includes(lesson.id)).slice(-2);
  return <section className="learning-roadmap" aria-label="Your personal learning roadmap">
    <span className="micro-label">YOUR NEXT THREE STEPS</span><h3>{levelLabels[profile.level]}</h3>
    <p>{learned.length ? `Build on ${learned.map((lesson) => lesson.title).join(" and ")}.` : "Your starting level sets the first steps. Each step supplies patterns used in the lessons after it."}</p>
    {next.length ? <ol>{next.map((lesson, index) => <li key={lesson.id}><span className="roadmap-number">{index + 1}</span><div><strong>{lesson.title}</strong><p>{lesson.detail}</p></div><button type="button" className="button button-quiet" disabled={!isLessonUnlocked(lesson, completed, placementKnowledge(profile))} onClick={() => onLesson(lesson)}>{index === 0 ? "Continue" : "Explore"}</button></li>)}</ol> : <p>Your current route is complete. Revisit a lesson or practice the cards you want to remember.</p>}
    <small>You can change your level and goals in Settings. Your level opens suitable starting lessons; it does not mark earlier lessons complete.</small>
  </section>;
}
