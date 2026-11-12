import {lessons,type Lesson,type LessonQuestion} from './curriculum';
export type CheckpointItem={id:string;lessonId:string;lessonTitle:string;question:LessonQuestion};
export function checkpointItems(completed:string[],catalog:Lesson[]=lessons):CheckpointItem[]{
 const groups=[...new Set(completed)].reverse().map(id=>catalog.find(lesson=>lesson.id===id)).filter((lesson):lesson is Lesson=>!!lesson&&!lesson.generatedPracticeOnly).map(lesson=>lesson.questions.filter(q=>!lesson.practiceOnlyQuestionIds?.includes(q.id)).map(question=>({id:`${lesson.id}:${question.id}`,lessonId:lesson.id,lessonTitle:lesson.title,question})));
 const result:CheckpointItem[]=[],seen=new Set<string>();
 for(let round=0;groups.some(group=>round<group.length)&&result.length<5;round++)for(const group of groups){
  const item=group[round];if(!item)continue;
  const fingerprint=[item.question.korean,item.question.prompt,item.question.answer].join('|').normalize('NFC').toLowerCase();
  if(seen.has(fingerprint))continue;seen.add(fingerprint);result.push(item);if(result.length===5)break;
 }
 return result;
}
