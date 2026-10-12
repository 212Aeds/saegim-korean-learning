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

export const conversationRequestSchema = z.strictObject({
  messages: z.array(z.strictObject({ role: z.enum(["user", "assistant"]), content: learnerText(600) })).min(1).max(11)
    .refine((messages) => messages.length % 2 === 1 && messages.every((message, index) => message.role === (index % 2 === 0 ? "user" : "assistant")), "Use alternating turns ending in a learner message."),
  level: z.enum(["new", "hangul", "basic", "intermediate"]),
  scenario: z.enum(["everyday", "cafe", "travel", "friends"]),
  consent: z.literal(true),
});
export type ConversationRequest = z.infer<typeof conversationRequestSchema>;
