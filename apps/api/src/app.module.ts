import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { DatabaseService } from "./database.service";
import { AuthController } from "./auth.controller";
import { LearningController, WordsController } from "./learning.controller";
import { SessionAuthGuard } from "./session-auth.guard";
import { DeveloperController } from "./developer.controller";

import { ProviderUsageService } from "./provider-usage.service";
import { AudioController } from "./audio/audio.controller";
import { AudioCatalogService } from "./audio/audio-catalog.service";
import { AudioStorage, NeonAudioStorage } from "./audio/audio-storage";
import { KoreanAudioProvider, UnavailableKoreanAudioProvider } from "./audio/audio-provider";
import { SpeechClipMiddleware, SpeechController } from "./speech/speech.controller";
import { KoreanSpeechProvider, OpenRouterKoreanSpeechProvider } from "./speech/speech-provider";
import { SpeechAudioCacheService } from "./speech/speech-audio-cache.service";
import { TutorController } from "./tutor/tutor.controller";
import { TutorService } from "./tutor/tutor.service";
import { OpenRouterTutorProvider, TutorProvider } from "./tutor/tutor-provider";

@Module({
  controllers: [LearningController, WordsController, AuthController, AudioController, SpeechController, TutorController, DeveloperController],
  providers: [DatabaseService, SessionAuthGuard, ProviderUsageService, SpeechAudioCacheService, AudioCatalogService, TutorService,
    { provide: AudioStorage, useClass: NeonAudioStorage },
    { provide: KoreanAudioProvider, useClass: UnavailableKoreanAudioProvider },
    { provide: KoreanSpeechProvider, useClass: OpenRouterKoreanSpeechProvider },
    { provide: TutorProvider, useClass: OpenRouterTutorProvider }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SpeechClipMiddleware).forRoutes({ path: "speech/transcribe", method: RequestMethod.POST });
  }
}
