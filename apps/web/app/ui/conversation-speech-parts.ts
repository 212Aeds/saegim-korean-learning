export function conversationSpeechParts(text:string):string[]{
 const sentences=text.trim().replace(/\s+/gu,' ').split(/(?<=[.!?。！？]) /u).filter(Boolean),parts:string[]=[];
 for(const sentence of sentences){
  if(parts.length&&parts[parts.length-1].length<12)parts[parts.length-1]+=' '+sentence;
  else parts.push(sentence);
 }
 return parts;
}
