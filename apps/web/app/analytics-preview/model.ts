export const features = ["today", "learn", "practice", "review", "words", "speak", "tutor"] as const;
export type Feature = typeof features[number];
export type Measurement = {feature: Feature; outcome: "success" | "failure" | "cancelled"; milliseconds: number};
export function summarize(input: unknown[]) {
  const valid = input.filter((entry): entry is Measurement => {
    if (!entry || typeof entry !== "object") return false;
    const e = entry as Measurement;
    return features.includes(e.feature) && ["success","failure","cancelled"].includes(e.outcome)
      && Number.isFinite(e.milliseconds) && e.milliseconds >= 0 && e.milliseconds <= 120000;
  });
  return {total: valid.length, rows: features.map(feature => {
    const events = valid.filter(e => e.feature === feature);
    const success = events.filter(e => e.outcome === "success").length;
    const failure = events.filter(e => e.outcome === "failure").length;
    const times = events.filter(e => e.outcome === "success").map(e => e.milliseconds).sort((a,b)=>a-b);
    const percentile = (p: number) => times.length ? times[Math.ceil(p*times.length)-1] : null;
    return {feature, count: events.length, success, failure, cancelled: events.length-success-failure,
      successRate: success+failure ? Math.round(success/(success+failure)*100) : null,
      p50: percentile(.5), p95: percentile(.95)};
  })};
}
export function availability(checks: boolean[]) {
  if (!checks.length) return "unknown";
  if (!checks.at(-1)) return "down";
  return checks.some(ok=>!ok) ? "recovered" : "up";
}
export const demoEvents: Measurement[] = features.flatMap((feature,index)=>Array.from({length:24-index*2},(_,n)=>({feature,outcome:n===7 ? "failure" as const:n===11 ? "cancelled" as const:"success" as const,milliseconds:feature==="tutor" ? 1800+n*140 : feature==="speak" ? 700+n*90 : 100+n*15})));
