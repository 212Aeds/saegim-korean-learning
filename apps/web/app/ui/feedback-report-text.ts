export function makeFeedbackReport(input: {area: string; publishing: boolean; hosted?: boolean; title: string; steps: string; expected: string}) {
  return ["# Saegim feedback", `Area: ${input.area}`, `Version: ${input.publishing ? "Device-only website" : input.hosted ? "Hosted beta" : "Local full app"}`,
    "", `## ${input.title.trim().slice(0,100) || "Untitled report"}`, "", "What happened / steps to repeat:",
    input.steps.trim().slice(0,1500) || "Not provided", "", "Expected:", input.expected.trim().slice(0,1000) || "Not provided",
    "", "Account details, saved progress, recordings, and AI conversations are not attached automatically."].join("\n");
}
