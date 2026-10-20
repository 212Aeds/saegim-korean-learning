import {lessons} from "../curriculum";
export function conversationLearning(completed:string[]){
 const selected=[...new Set(completed)].map(id=>lessons.find(lesson=>lesson.id===id)).filter((lesson):lesson is typeof lessons[number]=>!!lesson).slice(-4);
 const words=[...new Set(selected.flatMap(lesson=>lesson.words))].filter(word=>/^[가-힣ㄱ-ㅎㅏ-ㅣ ]{1,40}$/u.test(word)).slice(0,24);
 return {titles:selected.map(lesson=>lesson.title),words};
}
