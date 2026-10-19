import { lessons, type MultipleChoiceQuestion } from "./curriculum";
export const landingSamples = [
  {lessonId:"hangul-first-sounds",label:"Meet a letter"},
  {lessonId:"hello-there",label:"Find a useful greeting"},
  {lessonId:"introductions",label:"Try an introduction"},
].map(sample=>{
  const question=lessons.find(lesson=>lesson.id===sample.lessonId)?.questions.find((question):question is MultipleChoiceQuestion=>question.type==="choice");
  if(!question)throw new Error(`Missing public lesson sample: ${sample.lessonId}`);
  return {...sample,question};
});
