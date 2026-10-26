type Result={state:"success"|"limited"|"error";durationMs:number;at:string};
const results:Partial<Record<"tutor"|"whisper",Result>>={};
// Process-local diagnostics only: no IDs, payloads, provider bodies or history.
export function recordProviderResult(kind:"tutor"|"whisper",state:Result["state"],durationMs:number){
 results[kind]={state,durationMs:Math.max(0,Math.min(120000,Math.round(durationMs))),at:new Date().toISOString()};
}
export function providerResults(){return {tutor:results.tutor?{...results.tutor}:null,whisper:results.whisper?{...results.whisper}:null};}
