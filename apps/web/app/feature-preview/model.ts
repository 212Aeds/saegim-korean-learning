import {lessons} from "../curriculum";
export const previewStorageKey="saegim-feature-preview-phrasebook-v1";
export type SavedPhrase={korean:string;meaning:string};
export function readPreviewPhrases(raw:string|null):SavedPhrase[]{
 try{const data:unknown=JSON.parse(raw??"[]");if(!Array.isArray(data))return [];
 const seen=new Set<string>();return data.filter((item):item is SavedPhrase=>{
 if(!item||typeof item.korean!=="string"||typeof item.meaning!=="string")return false;
 const key=item.korean.normalize("NFC").trim();if(!key||!item.meaning.trim()||key.length>120||item.meaning.length>180||seen.has(key))return false;seen.add(key);return true;
 }).slice(0,30).map(item=>({korean:item.korean.trim(),meaning:item.meaning.trim()}));}catch{return [];}
}
export function addPreviewPhrase(items:SavedPhrase[],phrase:SavedPhrase){
 const korean=phrase.korean.normalize("NFC").trim(),meaning=phrase.meaning.trim();
 if(!korean||!meaning||korean.length>120||meaning.length>180)return {items,message:"Add a phrase and meaning within the character limits."};
 if(items.some(item=>item.korean.normalize("NFC").trim()===korean))return {items,message:"That phrase is already in your collection."};
 if(items.length>=30)return {items,message:"This preview holds up to 30 phrases."};
 return {items:[...items,{korean,meaning}],message:"Saved in your preview phrasebook."};
}
export const greetingLesson=lessons.find(lesson=>lesson.id==="hello-there")!;
export const introductionLesson=lessons.find(lesson=>lesson.id==="introductions")!;
export const greeting=greetingLesson.questions.find(question=>question.id==="hello-polite")!;
export const thanks=greetingLesson.questions.find(question=>question.id==="hello-thanks")!;
export const apology=greetingLesson.questions.find(question=>question.id==="hello-apology")!;
export type Branch="introduce"|"thank";
export function closingPhrase(branch:Branch):SavedPhrase{return branch==="introduce"?{korean:introductionLesson.briefing!.example,meaning:introductionLesson.briefing!.translation}:{korean:thanks.korean,meaning:thanks.answer};}
