export type ProviderResult={state:"success"|"limited"|"error";durationMs:number;at:string}|null;
type Allowance={state:"available"|"low"|"exhausted";limit:number;used:number;remaining:number;accountLimit:number}|null;
type SummaryRow={total:number;success:number;limited:number;error:number;p50UpperMs:number|null;p95UpperMs:number|null};
type Summary={since:string;tutor:SummaryRow;whisper:SummaryRow}|null;
export type Overview={usage:{date:string;requests:number;tutorRequests:number;tutorTokens?:string}[];measuredAt:string;allowance:Allowance;aiConfigured:boolean|null;providerResults:{tutor:ProviderResult;whisper:ProviderResult};providerSummary:Summary};
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==="object"&&!Array.isArray(value);
const count=(value:unknown):value is number=>typeof value==="number"&&Number.isSafeInteger(value)&&value>=0&&value<=1_000_000_000;
const timestamp=(value:unknown):value is string=>typeof value==="string"&&/^\d{4}-\d\d-\d\dT/.test(value)&&Number.isFinite(Date.parse(value));
function provider(value:unknown):ProviderResult{
 if(!record(value)||!["success","limited","error"].includes(String(value.state))||!count(value.durationMs)||!timestamp(value.at))return null;
 return {state:value.state as NonNullable<ProviderResult>["state"],durationMs:value.durationMs,at:value.at};
}
function summary(value:unknown):Summary{
 function row(v:unknown):v is SummaryRow{
  if(!record(v)||![v.total,v.success,v.limited,v.error].every(count)||v.total!==(v.success as number)+(v.limited as number)+(v.error as number))return false;
  if(v.p50UpperMs===null||v.p95UpperMs===null)return v.p50UpperMs===null&&v.p95UpperMs===null;
  return count(v.p50UpperMs)&&count(v.p95UpperMs)&&v.p50UpperMs<=v.p95UpperMs&&v.p95UpperMs<=120000&&(v.success as number)>0;
 }
 if(!record(value)||!timestamp(value.since)||!row(value.tutor)||!row(value.whisper))return null;
 return {since:value.since,tutor:{...value.tutor},whisper:{...value.whisper}};
}
export function parseOverview(value:unknown):Overview|null{
 if(!record(value)||!timestamp(value.measuredAt)||!Array.isArray(value.usage)||value.usage.length>30)return null;
 const today=new Date(value.measuredAt).toISOString().slice(0,10),cutoff=Date.parse(today)-29*86400000,seen=new Set<string>();
 const usage:Overview["usage"]=[];
 for(const row of value.usage){
  if(!record(row)||typeof row.date!=="string"||!/^\d{4}-\d\d-\d\d$/.test(row.date)||!Number.isFinite(Date.parse(row.date))||new Date(row.date).toISOString().slice(0,10)!==row.date||row.date>today||Date.parse(row.date)<cutoff||seen.has(row.date)||!count(row.requests)||!count(row.tutorRequests)||row.tutorRequests>row.requests)return null;
  seen.add(row.date);usage.push({date:row.date,requests:row.requests,tutorRequests:row.tutorRequests,...(typeof row.tutorTokens==="string"&&/^\d{1,20}$/.test(row.tutorTokens)?{tutorTokens:row.tutorTokens}:{})});
 }
 let allowance:Allowance=null;const a=value.allowance;
 if(record(a)&&["available","low","exhausted"].includes(String(a.state))&&count(a.limit)&&a.limit>0&&count(a.used)&&count(a.remaining)&&a.remaining<=a.limit&&count(a.accountLimit)&&a.accountLimit>0){
  allowance={state:a.state as NonNullable<Allowance>["state"],limit:a.limit,used:a.used,remaining:a.remaining,accountLimit:a.accountLimit};
 }
 const results=record(value.providerResults)?value.providerResults:{};
 return {usage:usage.sort((a,b)=>b.date.localeCompare(a.date)),measuredAt:value.measuredAt,allowance,aiConfigured:typeof value.aiConfigured==="boolean"?value.aiConfigured:null,providerResults:{tutor:provider(results.tutor),whisper:provider(results.whisper)},providerSummary:summary(value.providerSummary)};
}
export function summarizeUsage(report:Overview){
 return {requests:report.usage.reduce((n,row)=>n+row.requests,0),tutorRequests:report.usage.reduce((n,row)=>n+row.tutorRequests,0),activeDays:report.usage.filter(row=>row.requests>0).length,todayRequests:report.usage.find(row=>row.date===new Date(report.measuredAt).toISOString().slice(0,10))?.requests??0};
}
export function reportTime(value:string){return new Date(value).toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"});}
