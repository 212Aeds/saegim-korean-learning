import type { SpeakingCard } from "./speak-cards";
export function phraseTopics(cards: SpeakingCard[]) {
  return [...new Map(cards.map(card=>[card.lessonId??card.promptLabel,{id:card.lessonId??card.promptLabel,label:card.promptLabel}])).values()];
}
export function phrasePage(cards: SpeakingCard[], topic: string, query: string, requestedPage: number) {
  const search=query.normalize("NFKC").toLocaleLowerCase().trim();
  const matches=cards.filter(card=>(!topic||(card.lessonId??card.promptLabel)===topic)&&(!search||`${card.korean} ${card.meaning} ${card.romanization}`.normalize("NFKC").toLocaleLowerCase().includes(search)));
  const pages=Math.max(1,Math.ceil(matches.length/6)),page=Math.min(pages-1,Math.max(0,Number.isFinite(requestedPage)?Math.floor(requestedPage):0));
  return {cards:matches.slice(page*6,page*6+6),total:matches.length,page,pages};
}
