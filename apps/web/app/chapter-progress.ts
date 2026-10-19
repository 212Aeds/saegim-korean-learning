import { journeyTopics } from "./journey-content";
export function chapterProgress(completedLessonIds: string[]) {
  const completed = new Set(completedLessonIds);
  return journeyTopics.map(topic => {
    const stages = (["words","word-recall","dialogue","consolidation"] as const).map(part=>({
      id:`${topic.id}-${part}`, label:part==="words"?"Words":part==="word-recall"?"Word recall":part==="dialogue"?"Exchanges":"Put it together",
      completed:completed.has(`${topic.id}-${part}`),
    }));
    const done = stages.filter(stage=>stage.completed).length;
    return {id:topic.id,title:topic.title,stages,done,complete:done===stages.length,
      nextLessonId:stages.find(stage=>!stage.completed)?.id ?? stages[stages.length-1].id};
  });
}
