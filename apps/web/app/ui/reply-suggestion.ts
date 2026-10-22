type Suggestion={korean:string;english:string;feedback:string};
function comparable(text:string){return text.normalize("NFC").replace(/[\p{P}\p{Z}\s]/gu,"").toLowerCase();}
export function isRepeatedConversationLine(reply:string,previous:string){return comparable(reply)===comparable(previous);}
export function isUsefulReplySuggestion(value:unknown,question:string):value is Suggestion{
 if(!value||typeof value!=="object")return false;
 const idea=value as Suggestion;
 if(![idea.korean,idea.english,idea.feedback].every(part=>typeof part==="string"&&part.trim().length>0&&part.length<=500))return false;
 return /[가-힣]/u.test(idea.korean)&&!isRepeatedConversationLine(idea.korean,question);
}
