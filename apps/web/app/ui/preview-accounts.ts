// A file-only preview has no Render /api rewrite. Do not mistake that for an
// outage of the live account service, or change real production sign-in.
export async function previewAccountsMissing(apiUrl: string | undefined, hostname: string) {
  if (apiUrl !== "/api" || !["localhost", "127.0.0.1", "[::1]"].includes(hostname)) return false;
  try {
    const response = await fetch(`${apiUrl}/v1/health`, {
      credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(3000),
    });
    return response.status === 404 || response.headers.get("content-type")?.includes("text/html") === true;
  } catch {
    // A timeout alone does not prove that a configured backend is missing.
    return false;
  }
}
