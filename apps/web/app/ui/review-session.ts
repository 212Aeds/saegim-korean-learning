import { shuffle } from "../curriculum";
import { deduplicateReviewItems, type ReviewItem } from "../progress";

export function reviewSession(items: ReviewItem[], maxCards = items.length) {
  return shuffle(deduplicateReviewItems(items)).slice(0, maxCards);
}
