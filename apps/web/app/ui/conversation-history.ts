export type ConversationTurn = { role: "user" | "assistant"; content: string };
export function conversationHistory(turns: ConversationTurn[], next: string): ConversationTurn[] {
  // Retain the original topic plus four recent exchanges within the 11-message cap.
  const context = turns.length > 10 ? [...turns.slice(0, 2), ...turns.slice(-8)] : turns;
  return [...context.map(({ role, content }) => ({ role, content })), { role: "user" as const, content: next.trim().slice(0, 600) }];
}

export function shouldSendConversationKey(key: string, shift: boolean, composing: boolean, keyCode = 0) {
  return key === "Enter" && !shift && !composing && keyCode !== 229;
}

