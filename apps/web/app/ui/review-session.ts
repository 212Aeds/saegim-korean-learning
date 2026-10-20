import { deduplicateReviewItems, type ReviewItem } from "../progress";

export function reviewSession(items: ReviewItem[], maxCards = items.length) {
  const queue=deduplicateReviewItems(items).sort((left, right) =>
    Number(right.lastResult === "again") - Number(left.lastResult === "again") ||
    left.dueAt.localeCompare(right.dueAt) || left.repetitions - right.repetitions || left.id.localeCompare(right.id)
  ).slice(0, Math.max(0, maxCards));
  const result:ReviewItem[]=[];
  while(queue.length){const last=result.at(-1)?.front.normalize("NFC").trim();const different=queue.findIndex(card=>card.front.normalize("NFC").trim()!==last);result.push(queue.splice(different<0?0:different,1)[0]);}
  return result;
}

export function reviewOverview(items: ReviewItem[], now = new Date()) {
  const cards = deduplicateReviewItems(items);
  return {
    total: cards.length,
    due: cards.filter((item) => new Date(item.dueAt).getTime() <= now.getTime()).length,
    recovery: cards.filter((item) => item.lastResult === "again").length,
    established: cards.filter((item) => item.lastResult === "remembered" && item.repetitions >= 3).length,
  };
}
