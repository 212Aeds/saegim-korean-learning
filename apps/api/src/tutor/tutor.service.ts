import { HttpException, HttpStatus, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ProviderUsageService, TUTOR_REQUEST_RESERVATION_MICRO_USD } from "../provider-usage.service";
import { TutorProvider } from "./tutor-provider";
import type { TutorAnswer } from "./tutor.schema";

@Injectable()
export class TutorService {
  constructor(private readonly provider: TutorProvider, private readonly usage: ProviderUsageService) {}

  async answer(accountId: string, question: string, lessonContext: string): Promise<TutorAnswer> {
    if (!this.provider.isAvailable()) throw new ServiceUnavailableException("The tutor is unavailable. Use the lesson hint instead.");
    const reservation = await this.usage.allowAndRecord(accountId, "tutor", TUTOR_REQUEST_RESERVATION_MICRO_USD);
    if (!reservation.allowed) {
      if (reservation.reason === "spend-limit") {
        throw new HttpException("The Tutor reached its monthly project budget. It remains free for learners; please try again next month.", HttpStatus.TOO_MANY_REQUESTS);
      }
      if (reservation.reason === "account-limit" || reservation.reason === "project-limit") {
        throw new HttpException("The tutor's daily limit has been reached. Use the lesson hint instead.", HttpStatus.TOO_MANY_REQUESTS);
      }
      throw new ServiceUnavailableException("The tutor is unavailable. Use the lesson hint instead.");
    }
    try {
      return await this.provider.answer({ question, lessonContext });
    } catch {
      // Provider bodies, credentials, and learner content never enter logs.
      throw new ServiceUnavailableException("The tutor could not answer. Use the lesson hint instead.");
    }
  }
}
