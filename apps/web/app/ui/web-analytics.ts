// Cloudflare's public beacon identifier, not an API credential.
// Host gating keeps local builds and preview fixtures out of the real metrics.
const token = "15b4697f956d4055b0d99003a3c05209";
type BrowserHints = { hostname: string; doNotTrack?: string | null; globalPrivacyControl?: boolean };

export function installCloudflareAnalytics(doc: Document, hints: BrowserHints) {
  if (hints.hostname !== "saegim.onrender.com" || hints.globalPrivacyControl ||
      hints.doNotTrack === "1" || hints.doNotTrack === "yes" ||
      doc.getElementById("saegim-web-analytics")) return;
  const script = doc.createElement("script");
  script.id = "saegim-web-analytics";
  script.type = "module";
  script.async = true;
  script.src = "https://static.cloudflareinsights.com/beacon.min.js";
  script.setAttribute("data-cf-beacon", JSON.stringify({ token, spa: false }));
  doc.body.appendChild(script);
}
