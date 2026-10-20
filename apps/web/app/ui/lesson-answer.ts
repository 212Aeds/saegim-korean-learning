import {isCorrectTextAnswer, lessons, type TextQuestion} from "../curriculum";
const english=(value:string)=>value.normalize("NFKC").toLowerCase().replace(/[.,!?]/g, "").trim().replace(/\s+/g," ");
const knownWords=new Set(lessons.flatMap(lesson=>lesson.questions.flatMap(question=>[question.answer,...(question.type==="text"?question.accepted:[])])).flatMap(value=>english(value).split(" ")));
// Only forgive one spelling edit in a substantial English definition word.
// Korean, short answers, known alternative words and changed word counts stay exact.
export function lessonTextAssessment(question:TextQuestion,value:string){
 if(isCorrectTextAnswer(question,value))return {correct:true,near:false};
 const typed=english(value);
 if(!/^[a-z ]+$/.test(typed))return {correct:false,near:false};
 const near=[question.answer,...question.accepted].some(candidate=>{
 const target=english(candidate),a=typed.split(" "),b=target.split(" ");
 if(!/^[a-z ]+$/.test(target)||a.length!==b.length)return false;
 const changed=a.map((word,i)=>word===b[i]?-1:i).filter(i=>i>=0);
 if(changed.length!==1)return false;
 const i=changed[0],x=a[i],y=b[i];if(knownWords.has(x)||["never","cannot","should","would","could"].includes(x))return false;if(Math.min(x.length,y.length)<5||Math.abs(x.length-y.length)>1)return false;
 let edits=0,left=0,right=0;
 while(left<x.length&&right<y.length){if(x[left]===y[right]){left++;right++;continue;}if(++edits>1)return false;if(x.length>=y.length)left++;if(y.length>=x.length)right++;}
 return edits+(x.length-left)+(y.length-right)<=1;
 });
 return {correct:near,near};
}
export function appendLessonRetry<T>(questions:T[],step:number):T[]{return [...questions,questions[step]];}
