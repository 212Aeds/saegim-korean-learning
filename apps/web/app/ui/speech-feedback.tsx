import { SoriMascot } from "./sori-mascot";
import { transcriptRomanization } from "./transcript-romanization";

export function SpeechFeedback({transcript,matches}: {transcript:string;matches:boolean|null}) {
  const romanization=transcriptRomanization(transcript);
  return <div className="speech-transcript speech-feedback-card" data-match={matches===true} role="status" aria-live="polite">
    <p className="speech-korean" lang="ko">{transcript}</p>
    {romanization && romanization!==transcript.trim() && <p className="transcript-romanization" lang="ko-Latn">{romanization}</p>}
    {matches!==null && <div className="speech-result">
      <SoriMascot className="speech-result-mascot" thumbsUp={matches} />
      <div><strong>{matches?"Match":"Try again"}</strong><p>{matches?"잘했어요! Nice work.":"The transcript differs. Recognition can miss words; this does not measure pronunciation. Try again or write your answer."}</p></div>
    </div>}
  </div>;
}
