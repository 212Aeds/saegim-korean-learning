import type { SpeakingCard } from "./speak-cards";
export function phraseTopics(cards: SpeakingCard[]) {
  return [...new Map(cards.map(card=>[card.lessonId??card.promptLabel,{id:card.lessonId??card.promptLabel,label:card.promptLabel}])).values()];
}
export function phrasePage(cards: SpeakingCard[], topic: string, query: string, requestedPage: number) {
  const tokens=query.normalize("NFKC").toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu)??[];
  const matches=cards.filter(card=>{
    if(topic&&(card.lessonId??card.promptLabel)!==topic)return false;
    const text=`${card.korean} ${card.meaning} ${card.romanization} ${card.promptLabel} ${card.focusMeaning} ${card.lessonId??""}`.normalize("NFKC").toLocaleLowerCase();
    const words=text.match(/[\p{L}\p{N}]+/gu)??[];
    const tags:string[]=[];
    if(/\b(food|meal|meals|eat|eaten|eating|drink|drinking|café|cafe|coffee|tea|restaurant|fruit|snacks|sugar|ice|breakfast|lunch|dinner|spicy|meat|peanuts)\b/u.test(text))tags.push("food","meal","meals","dining");
    if(/\b(hello|greeting|greetings|hi)\b/u.test(text))tags.push("hello","hi","greeting","greetings");
    if(/\b(son|daughter|parents|grandmother|grandfather|family|child)\b/u.test(text))tags.push("family","relatives");
    return tokens.every(token=>/[가-힣ㄱ-ㅎㅏ-ㅣ]/u.test(token)?text.includes(token):[...words,...tags].some(word=>word.startsWith(token)));
  });
  const pages=Math.max(1,Math.ceil(matches.length/6)),page=Math.min(pages-1,Math.max(0,Number.isFinite(requestedPage)?Math.floor(requestedPage):0));
  return {cards:matches.slice(page*6,page*6+6),total:matches.length,page,pages};
}
