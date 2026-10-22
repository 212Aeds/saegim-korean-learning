export type ConversationTurn = { role: "user" | "assistant"; content: string };
export function conversationHistory(turns: ConversationTurn[], next: string): ConversationTurn[] {
  // Five complete exchanges plus this turn; begin and end with the learner.
  return [...turns.slice(-10).map(({ role, content }) => ({ role, content })), { role: "user" as const, content: next.trim().slice(0, 600) }];
}

export function shouldSendConversationKey(key: string, shift: boolean, composing: boolean, keyCode = 0) {
  return key === "Enter" && !shift && !composing && keyCode !== 229;
}

