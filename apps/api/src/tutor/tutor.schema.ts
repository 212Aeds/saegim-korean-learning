import { z } from "zod";

const learnerText = (limit: number) => z.string().trim().min(1).max(limit)
  .refine((value) => !/[\u0000-\u001f\u007f]/u.test(value));

export const tutorRequestSchema = z.strictObject({
  question: learnerText(600),
  lessonId: learnerText(100),
  lessonContext: learnerText(2_000),
  consent: z.literal(true),
});

const answerText = z.string().trim().min(1).max(500)
  .refine((value) => !/[\u0000-\u001f\u007f<>`*_\[\]]/u.test(value));

export const tutorAnswerSchema = z.strictObject({
  explanation: answerText,
  hint: answerText,
  nextExercise: answerText,
});

export type TutorAnswer = z.infer<typeof tutorAnswerSchema>;
