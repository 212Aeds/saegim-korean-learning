export type ConversationTurn = { role: "user" | "assistant"; content: string };
export function conversationHistory(turns: ConversationTurn[], next: string): ConversationTurn[] {
  // Five complete exchanges plus this turn; begin and end with the learner.
  return [...turns.slice(-10), { role: "user" as const, content: next.trim().slice(0, 600) }];
}
