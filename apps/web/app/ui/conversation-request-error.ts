export function conversationRequestError(status: number) {
  if (status === 429) return "The free tutor daily request limit has been reached. Your message is saved here. Try on another day; lessons and review still work.";
  if (status === 401) return "Sign in again to continue. Your message is still here.";
  return "Your partner could not reply. Your message is still here; please try again.";
}
