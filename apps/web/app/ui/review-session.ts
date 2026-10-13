import { deduplicateReviewItems, type ReviewItem } from "../progress";

export function reviewSession(items: ReviewItem[], maxCards = items.length) {
  return deduplicateReviewItems(items).sort((left, right) =>
    Number(right.lastResult === "again") - Number(left.lastResult === "again") ||
    left.dueAt.localeCompare(right.dueAt) || left.repetitions - right.repetitions || left.id.localeCompare(right.id)
  ).slice(0, Math.max(0, maxCards));
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
