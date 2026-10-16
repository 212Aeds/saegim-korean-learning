const models = { tutor: "@cf/qwen/qwen3-30b-a3b-fp8", whisper: "@cf/openai/whisper-large-v3-turbo" } as const;
export const usesCloudflareTutor = () => process.env.TUTOR_PROVIDER === "cloudflare";
export const usesCloudflareSpeech = () => process.env.SPEECH_PROVIDER === "cloudflare";
export function cloudflareAvailable() {
  return process.env.CLOUDFLARE_FREE_PLAN_CONFIRMED === "true" && /^[a-f0-9]{32}$/i.test(process.env.CLOUDFLARE_ACCOUNT_ID || "") && Boolean(process.env.CLOUDFLARE_API_TOKEN?.trim());
}
// Fixed destinations/models; never accept a user-selected URL, model or billing gateway.
export async function cloudflareRequest(kind: keyof typeof models, body: unknown): Promise<unknown> {
  if (!cloudflareAvailable()) throw Error("Cloudflare unavailable");
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(),kind === "whisper" ? 14_000 : 60_000);
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${models[kind]}`, {
      method:"POST", redirect:"error", signal:controller.signal,
      headers:{Authorization:`Bearer ${process.env.CLOUDFLARE_API_TOKEN?.trim()}`,"Content-Type":"application/json"},body:JSON.stringify(body),
    });
    if(!response.ok || !response.body) throw Error("Cloudflare unavailable");
    if(Number(response.headers.get("content-length")) > 65_536) throw Error("Cloudflare response too large");
    const chunks:Uint8Array[]=[];let bytes=0;const reader=response.body.getReader();
    while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>65_536){await reader.cancel();throw Error("Cloudflare response too large");}chunks.push(part.value);}
    const value=JSON.parse(Buffer.concat(chunks).toString("utf8")) as {success?:boolean;result?:unknown};
    if(!value || value.success!==true || !value.result || typeof value.result!=="object") throw Error("Cloudflare unavailable");
    return value.result;
  } finally { clearTimeout(timer);controller.abort(); }
}
