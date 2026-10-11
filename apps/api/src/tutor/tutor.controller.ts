import { BadRequestException, Body, Controller, Header, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { SessionAuthGuard, type SessionRequest } from "../session-auth.guard";
import { tutorRequestSchema } from "./tutor.schema";
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
}
