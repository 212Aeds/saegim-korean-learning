import type { Lesson } from "./curriculum";
import { journeyTopics } from "./journey-content";

// Retrieval practice reuses the chapter's referenced dictionary senses.
export const wordRecallLessons: Lesson[] = journeyTopics.map(topic => ({
  id: `${topic.id}-word-recall`, title: `${topic.title}: recall`,
  detail: "Recall six word meanings without multiple-choice hints", category: "Vocabulary",
  minutes: 6, pathwayId: topic.pathwayId ?? "everyday", level: "foundation",
  prerequisiteLessonIds: [`${topic.id}-words`], words: topic.items.map(item => item[0]), authoredOnly: true,
  briefing: { focus: "Bring the meaning back from memory.",
    explanation: "Read or listen to each Korean word, then type its English meaning. Try before checking the answer; revisit the word lesson if you need a reminder.",
    useWhen: "Use this short recall step between learning words and practicing sentences.",
    example: topic.items[0][0], translation: topic.items[0][1] },
  questions: topic.items.map(([korean, meaning], index) => ({
    id: `${topic.id}-meaning-recall-${index}`, type: "text", korean,
    prompt: "Recall this word’s English meaning.", answer: meaning,
    accepted: meaning.split(";").map(sense => sense.trim()).filter(Boolean),
    placeholder: "English meaning", tip: `${korean}: ${meaning}.`,
  })),
}));
