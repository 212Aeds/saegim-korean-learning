export async function copyFeedbackReport(report: string, clipboard?: Pick<Clipboard, "writeText">): Promise<"copied" | "unavailable"> {
  if (!clipboard) return "unavailable";
  try {
    await clipboard.writeText(report);
    return "copied";
  } catch {
    return "unavailable";
  }
}
