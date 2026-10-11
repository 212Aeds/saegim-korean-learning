// Provider selection, Korean-speaker audition, training terms and a billing hard
// limit are still open. No candidate voice or outbound implementation is enabled.
export abstract class KoreanAudioProvider {
  abstract synthesize(text: string, providerVoiceId: string): Promise<{
    bytes: Uint8Array;
    contentType: string;
  }>;
}

export class UnavailableKoreanAudioProvider extends KoreanAudioProvider {
  async synthesize(_text: string, _providerVoiceId: string): Promise<never> {
    throw new Error("Audio generation is unavailable pending provider and voice approval.");
  }
}
