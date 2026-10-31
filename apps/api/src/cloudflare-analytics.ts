type Breakdown={label:string;count:number};
type TrafficData={visits:number;pageViews:number;performanceSamples:number;vitalSamples:number;pageLoadAvgMs:number|null;pageLoadP75Ms:number|null;lcpP75Ms:number|null;inpP75Ms:number|null;clsP75:number|null;referrals:Breakdown[];devices:Breakdown[];browsers:Breakdown[];countries:Breakdown[]};
export type TrafficReport={state:"ready"|"stale"|"unavailable"|"unconfigured";measuredAt:string|null;periodStart:string|null;periodEnd:string|null;data:TrafficData|null};
const object=(value:unknown):Record<string,any>=>{if(!value||typeof value!=="object"||Array.isArray(value))throw Error("Invalid analytics shape");return value as Record<string,any>;};
function count(value:unknown){if(typeof value!=="number"||!Number.isSafeInteger(value)||value<0||value>1e12)throw Error("Invalid analytics count");return value;}
function metric(value:unknown,scale=1000){if(typeof value!=="number"||!Number.isFinite(value)||Math.abs(value)>1e12)throw Error("Invalid analytics metric");return value<0?null:value/scale;}
function rows(value:unknown,max:number){if(!Array.isArray(value)||value.length>max)throw Error("Invalid analytics rows");return value.map(object);}
function breakdown(value:unknown,dimension:string,visits=false):Breakdown[]{
 return rows(value,5).map(row=>{const raw=object(row.dimensions)[dimension];if(typeof raw!=="string")throw Error("Invalid analytics dimension");
  // Host names and broad categories only; never return paths, query strings or raw user agents.
  const label=raw===""?"Direct / unknown":raw.length<=80&&/^[\p{L}\p{N} ._()/-]+$/u.test(raw)?raw:"Other";
  return {label,count:count(visits?object(row.sum).visits:row.count)};
 });
}
function normalize(value:unknown):TrafficData{
 const body=object(value);if(body.errors)throw Error("Analytics query failed");
 const accounts=rows(object(object(body.data).viewer).accounts,1);if(accounts.length!==1)throw Error("Account unavailable");const a=accounts[0];
 const total=rows(a.total,1)[0],performance=rows(a.performance,1)[0],vitals=rows(a.vitals,1)[0];
 const performanceSamples=performance?count(performance.count):0,vitalSamples=vitals?count(vitals.count):0;
 return {visits:total?count(object(total.sum).visits):0,pageViews:total?count(total.count):0,performanceSamples,vitalSamples,
  pageLoadAvgMs:performanceSamples?metric(object(performance!.avg).pageLoadTime):null,pageLoadP75Ms:performanceSamples?metric(object(performance!.quantiles).pageLoadTimeP75):null,
  lcpP75Ms:vitalSamples?metric(object(vitals!.quantiles).largestContentfulPaintP75):null,inpP75Ms:vitalSamples?metric(object(vitals!.quantiles).interactionToNextPaintP75):null,clsP75:vitalSamples?metric(object(vitals!.quantiles).cumulativeLayoutShiftP75,1):null,
  referrals:breakdown(a.referrals,"refererHost",true),devices:breakdown(a.devices,"deviceType"),browsers:breakdown(a.browsers,"userAgentBrowser"),countries:breakdown(a.countries,"countryName")};
}
// Exact fields, types and timing units verified using Cloudflare's authenticated
// schema introspection. The token is separate from Workers AI and never returned.
function query(account:string,start:string,end:string){
 const filter=`{siteTag:"ad8cd0087dd04c8b97b9e8ec5910e488",requestHost:"saegim.onrender.com",bot:0,datetime_geq:"${start}",datetime_lt:"${end}"}`;
 return `{viewer{accounts(filter:{accountTag:"${account}"}){
 total:rumPageloadEventsAdaptiveGroups(limit:1,filter:${filter}){count sum{visits}}
 performance:rumPerformanceEventsAdaptiveGroups(limit:1,filter:${filter}){count avg{pageLoadTime} quantiles{pageLoadTimeP75}}
 vitals:rumWebVitalsEventsAdaptiveGroups(limit:1,filter:${filter}){count quantiles{largestContentfulPaintP75 interactionToNextPaintP75 cumulativeLayoutShiftP75}}
 referrals:rumPageloadEventsAdaptiveGroups(limit:5,filter:${filter},orderBy:[sum_visits_DESC]){sum{visits} dimensions{refererHost}}
 devices:rumPageloadEventsAdaptiveGroups(limit:5,filter:${filter},orderBy:[count_DESC]){count dimensions{deviceType}}
 browsers:rumPageloadEventsAdaptiveGroups(limit:5,filter:${filter},orderBy:[count_DESC]){count dimensions{userAgentBrowser}}
 countries:rumPageloadEventsAdaptiveGroups(limit:5,filter:${filter},orderBy:[count_DESC]){count dimensions{countryName}}
 }}}`;
}
export function createTrafficReader({env=process.env,request=fetch,now=Date.now}:{env?:NodeJS.ProcessEnv;request?:typeof fetch;now?:()=>number}={}){
 let snapshot:TrafficReport|null=null,refreshAfter=0,inFlight:Promise<TrafficReport>|null=null;
 const empty=(state:TrafficReport["state"]):TrafficReport=>({state,measuredAt:null,periodStart:null,periodEnd:null,data:null});
 return async function read():Promise<TrafficReport>{
  if(env.CLOUDFLARE_ANALYTICS_ENABLED!=="true"||!env.CLOUDFLARE_ANALYTICS_API_TOKEN?.trim()||!/^[a-f0-9]{32}$/i.test(env.CLOUDFLARE_ACCOUNT_ID??""))return empty("unconfigured");
  if(snapshot&&now()<refreshAfter)return structuredClone(snapshot);
  if(inFlight)return structuredClone(await inFlight);
  inFlight=(async()=>{
   const end=new Date(now()).toISOString(),start=new Date(now()-86400000).toISOString(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
   try{
    const response=await request("https://api.cloudflare.com/client/v4/graphql",{method:"POST",redirect:"error",signal:controller.signal,headers:{Authorization:`Bearer ${env.CLOUDFLARE_ANALYTICS_API_TOKEN!.trim()}`,"Content-Type":"application/json"},body:JSON.stringify({query:query(env.CLOUDFLARE_ACCOUNT_ID!,start,end)})});
    if(!response.ok||!response.body||Number(response.headers.get("content-length"))>131072)throw Error("Analytics unavailable");
    const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0;
    while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>131072){await reader.cancel();throw Error("Analytics response too large");}chunks.push(part.value);}
    const data=normalize(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    snapshot={state:"ready",measuredAt:new Date(now()).toISOString(),periodStart:start,periodEnd:end,data};refreshAfter=now()+300000;
   }catch{snapshot=snapshot?.data?{...snapshot,state:"stale"}:empty("unavailable");refreshAfter=now()+60000;}
   finally{clearTimeout(timer);controller.abort();}
   return structuredClone(snapshot!);
  })();
  try{return await inFlight;}finally{inFlight=null;}
 };
}
export const cloudflareTraffic=createTrafficReader();
