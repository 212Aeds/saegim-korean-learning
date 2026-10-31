type Result={state:"success"|"limited"|"error";durationMs:number;at:string};
const results:Partial<Record<"tutor"|"whisper",Result>>={};
const bounds=[100,250,500,1000,2000,5000,10000,30000,60000,120000];
const since=new Date().toISOString();
const empty=()=>({total:0,success:0,limited:0,error:0,buckets:bounds.map(()=>0)});
const counts={tutor:empty(),whisper:empty()};
// Fixed-size process-local aggregates only: no IDs, payloads or event history.
export function recordProviderResult(kind:"tutor"|"whisper",state:Result["state"],durationMs:number){
 const valid=Number.isFinite(durationMs)&&durationMs>=0&&durationMs<=120000;
 const duration=valid?Math.min(120000,Math.round(durationMs)):0;
 results[kind]={state,durationMs:duration,at:new Date().toISOString()};
 const row=counts[kind];if(row.total>=1_000_000_000)return;
 row.total++;row[state]++;
 if(state==="success"&&valid)row.buckets[bounds.findIndex(n=>duration<=n)]++;
}
export function providerResults(){return {tutor:results.tutor?{...results.tutor}:null,whisper:results.whisper?{...results.whisper}:null};}
export function providerSummary(){
 function summary(row:ReturnType<typeof empty>){
  function percentile(p:number){const samples=row.buckets.reduce((a,b)=>a+b,0);if(!samples)return null;const rank=Math.ceil(samples*p);let count=0;return bounds.find((_,i)=>(count+=row.buckets[i])>=rank)??null;}
  return {total:row.total,success:row.success,limited:row.limited,error:row.error,p50UpperMs:percentile(.5),p95UpperMs:percentile(.95)};
 }
 return {since,tutor:summary(counts.tutor),whisper:summary(counts.whisper)};
}
