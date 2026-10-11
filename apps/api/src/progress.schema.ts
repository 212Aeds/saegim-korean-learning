import { z } from "zod";

export const progressSchema = z.object({
  completed: z.number().int().min(0).max(500),
  dailyGoalMinutes: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20), z.literal(30), z.literal(45), z.literal(60)]).default(15),
  speakingCardIds: z.array(z.string().min(1).max(80)).max(200).default([]),
  speakingCardId: z.string().min(1).max(80).nullable().default(null),
  learningPreferences: z.object({
    romanization: z.boolean(),
    hangulSize: z.enum(["standard", "large"]),
    hintLevel: z.enum(["gentle", "standard", "challenge"]),
    speechVoice: z.enum(["jessica", "chris"]),
    speechPace: z.number().min(0.65).max(1.1),
  }).partial()
    .transform((preferences) => ({
      romanization: preferences.romanization ?? true,
      hangulSize: preferences.hangulSize ?? "standard",
      hintLevel: preferences.hintLevel ?? "standard",
      speechVoice: preferences.speechVoice ?? "jessica",
      speechPace: preferences.speechPace ?? 1,
    }))
    .default({ romanization: true, hangulSize: "standard", hintLevel: "standard", speechVoice: "jessica", speechPace: 1 }),
  completedLessonIds: z.array(z.string().min(1).max(80)).max(500).default([]),
  wordsLearned: z.array(z.string().min(1).max(80)).max(2_000).default([]),
  reviewsDone: z.number().int().min(0).max(100_000),
  quizAttempts: z.number().int().min(0).max(1_000_000).default(0),
  quizCorrect: z.number().int().min(0).max(1_000_000).default(0),
  streak: z.number().int().min(0).max(100_000),
  lastActivity: z.string().date().nullable(),
  activityDates: z.array(z.string().date()).max(90),
  reviewItems: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        front: z.string().min(1).max(120),
        question: z.string().min(1).max(160),
        answer: z.string().min(1).max(120),
        accepted: z.array(z.string().min(1).max(120)).max(20).optional(),
        note: z.string().min(1).max(500),
        repetitions: z.number().int().min(0).max(100_000),
        dueAt: z.string().datetime(),
      }),
    )
    .max(500),
});

export type ProgressPayload = z.infer<typeof progressSchema>;
