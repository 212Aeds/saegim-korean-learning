import type {ConversationRequest, TutorAnswer} from "./tutor.schema";

// Generated dialogue stays contextual. Teaching notes use authored guidance
// instead of presenting unchecked model corrections as grammar facts.
// NIKL 좋아하다: https://krdict.korean.go.kr/eng/dicSearch/SearchView?ParaWordNo=27929&nation=eng
export function conversationGuidance(input:ConversationRequest,answer:TutorAnswer):TutorAnswer {
  let nextExercise:string;
  if(input.mode==="reply-help")
    nextExercise="This is an editable example. Change the details to fit what you want to say, then send your reply.";
  else if(/좋아하|좋아해/.test(input.messages.at(-1)?.content+" "+answer.explanation))
    nextExercise="좋아해요 can end a polite sentence. 좋아하는 describes a following noun, as in 좋아하는 책. These are different grammatical forms, not a formality ranking. Source: NIKL Korean-English dictionary, 좋아하다.";
  else if(input.level==="new"||input.level==="hangul")
    nextExercise="One familiar word or a short phrase is enough to try. You can ask for an English explanation or use Suggest a reply for an editable example.";
  else if(input.level==="basic")
    nextExercise="Try one short sentence answering the latest question. Ask your partner to explain an unfamiliar word, or use Suggest a reply for an editable example.";
  else
    nextExercise="Answer the latest question, then add a reason or a related question if you feel ready. You can ask your partner to simplify or explain a word.";
  return {...answer,nextExercise};
}
