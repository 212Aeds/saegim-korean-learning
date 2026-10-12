import { BadRequestException, Body, Controller, Header, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { SessionAuthGuard, type SessionRequest } from "../session-auth.guard";
import { tutorRequestSchema, conversationRequestSchema } from "./tutor.schema";
import { TutorService } from "./tutor.service";

@Controller("tutor")
@UseGuards(SessionAuthGuard)
export class TutorController {
  constructor(private readonly tutor: TutorService) {}

  @Post("answer")
  @Header("Cache-Control", "private, no-store")
  async answer(@Req() request: SessionRequest, @Body() body: unknown) {
    const parsed = tutorRequestSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException("Enter a question, lesson context, and consent within the allowed limits.");
    if (!request.soriAccountId) throw new UnauthorizedException("Sign in to use the tutor.");
    return this.tutor.answer(request.soriAccountId, parsed.data.question, parsed.data.lessonContext);
  }

  @Post("conversation")
  @Header("Cache-Control", "private, no-store")
  async conversation(@Req() request: SessionRequest, @Body() body: unknown) {
    const parsed = conversationRequestSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException("Send a short conversation with alternating turns, a level, a scenario, and consent.");
    if (!request.soriAccountId) throw new UnauthorizedException("Sign in to practice a conversation.");
    const answer = await this.tutor.answer(request.soriAccountId, parsed.data.messages.at(-1)!.content,
      "Korean conversation practice", parsed.data);
    return { korean: answer.explanation, english: answer.hint, feedback: answer.nextExercise };
  }
}
