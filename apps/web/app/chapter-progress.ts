import { journeyTopics } from "./journey-content";
export function chapterProgress(completedLessonIds: string[]) {
  const completed = new Set(completedLessonIds);
  return journeyTopics.map(topic => {
    const stages = (["words","dialogue","consolidation"] as const).map(part=>({
      id:`${topic.id}-${part}`, label:part==="words"?"Words":part==="dialogue"?"Exchanges":"Recall",
      completed:completed.has(`${topic.id}-${part}`),
    }));
    const done = stages.filter(stage=>stage.completed).length;
    return {id:topic.id,title:topic.title,stages,done,complete:done===3,
      nextLessonId:stages.find(stage=>!stage.completed)?.id ?? stages[2].id};
  });
}
