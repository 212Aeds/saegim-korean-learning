import {learningRoute,defaultLearningProfile,type LearningProfile} from "./learning-profile";
import {isLessonUnlocked} from "./learning-pathways";
const starterLessonIds=new Set(learningRoute(defaultLearningProfile).slice(0,3).map(lesson=>lesson.id));
export const isStarterLesson=(id:string)=>starterLessonIds.has(id);

export function starterJourney(profile:LearningProfile,completed:string[]){
 if(profile.level!=="new"||completed.length>3)return null;
 const first=learningRoute(profile).slice(0,3);
 const ids=new Set(first.map(lesson=>lesson.id));
 // Do not replace an established learner's dashboard or rewrite their progress.
 if(completed.some(id=>!ids.has(id)))return null;
 const nextLesson=first.find(lesson=>!completed.includes(lesson.id));
 if(!nextLesson||!isLessonUnlocked(nextLesson,completed,[]))return null;
 return {steps:first.map(lesson=>({lesson,complete:completed.includes(lesson.id)})),nextLesson,completed:first.filter(lesson=>completed.includes(lesson.id)).length};
}
