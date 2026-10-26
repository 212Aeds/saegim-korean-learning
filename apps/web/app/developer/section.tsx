"use client";
import {useEffect,useState} from "react";
import dynamic from "next/dynamic";
import {publicApiUrl} from "../release";
import styles from "../analytics-preview/preview.module.css";
import healthStyles from "./health.module.css";
const AnalyticsPreview=dynamic(()=>import("../analytics-preview/preview").then(m=>m.AnalyticsPreview));
type Result={state:"success"|"limited"|"error";durationMs:number;at:string}|null;
type Overview={usage:{date:string;requests:number;tutorRequests:number}[];measuredAt:string;allowance?:{state:"unknown"|"available"|"low"|"exhausted";limit:number|null;used:number|null;remaining:number|null;accountLimit:number|null};aiConfigured?:boolean|null;providerResults?:{tutor:Result;whisper:Result}};
type Health={state:"checking"|"ready"|"database"|"failed";at:string|null};
function latest(result:Result|undefined){return !result?"No request observed since API restart":result.state==="success"?"Last provider response succeeded":result.state==="limited"?"Last request rate/quota limited":"Last request failed";}
export function DeveloperSection(){
 const [overview,setOverview]=useState<Overview|null>(null),[state,setState]=useState("Checking your developer access…"),[demo,setDemo]=useState(false),[attempt,setAttempt]=useState(0),[pending,setPending]=useState(true),[health,setHealth]=useState<Health>({state:"checking",at:null});
 useEffect(()=>{
  if(!publicApiUrl){setState("Developer access requires the connected account API.");setPending(false);return;}
  const controller=new AbortController();let active=true;const timer=setTimeout(()=>controller.abort(),75000);
  setPending(true);setHealth({state:"checking",at:null});
  const options={credentials:"include" as const,cache:"no-store" as const,signal:controller.signal};
  const report=fetch(`${publicApiUrl}/v1/developer/overview`,options).then(async response=>{
   if(!response.ok){if(active){if(response.status===401||response.status===403)setOverview(null);setState(response.status===401?"Sign in to your owner account on the home page, then return here.":response.status===403?"This section is restricted to the developer account.":"The developer report is unavailable. Any previous snapshot below is out of date.");}return;}
   const data=await response.json() as Overview;if(active){setOverview(data);setState("");}
  }).catch(()=>{if(active)setState("Could not reach the account service. This may be a cold start, outage or connection problem; a global outage is not confirmed. Any previous snapshot below is out of date.");});
  const check=fetch(`${publicApiUrl}/v1/health`,options).then(async response=>{
   const body=await response.json().catch(()=>null);if(active)setHealth({state:response.ok&&body?.database==="connected"?"ready":body?.database==="disconnected"?"database":"failed",at:new Date().toISOString()});
  }).catch(()=>{if(active)setHealth({state:"failed",at:new Date().toISOString()});});
  void Promise.allSettled([report,check]).finally(()=>{clearTimeout(timer);if(active)setPending(false);});
  return()=>{active=false;clearTimeout(timer);controller.abort();};
 },[attempt]);
 const allowance=overview?.allowance;
 const allowanceTitle=!allowance||allowance.state==="unknown"?"Allowance unknown":allowance.state==="exhausted"?"App daily allowance exhausted":allowance.state==="low"?"App allowance running low":"App allowance available";
 return <><main className={styles.lab}>
  <a href="/">← Back to Saegim</a><span className={styles.badge}>DEVELOPER · PRIVATE ACCOUNT ACCESS</span><h1>Your beta control room.</h1>
  <div className={healthStyles.toolbar}><p>Service checks and budget signals first. Traffic and history below.</p><button disabled={pending} onClick={()=>{setState("");setAttempt(n=>n+1);}}>{pending?"Checking…":"Refresh status"}</button></div>
  {state&&<p role="status" className={styles.notice}>{state}</p>}
  {!overview?<p>Connection check: {health.state==="checking"?"waiting for the API (free hosting can need time to wake)":health.state==="ready"?"API and database responded":health.state==="database"?"API responded, but database is unavailable":"API check failed from this browser"}.</p>:<>
   <nav className={healthStyles.nav} aria-label="Developer sections"><a href="#services">Service checks</a><a href="#allowance">AI allowance</a><a href="#traffic">Traffic</a><a href="#history">Usage history</a><a href="#experiments">Experiments</a></nav>
   <section className={styles.panel} id="services"><h2>Service checks</h2><div className={healthStyles.grid}>
    <article className={healthStyles.card}><h3>Website</h3><strong>This page loaded</strong><p>Your browser reached this page. This is not a continuous uptime measurement.</p></article>
    <article className={healthStyles.card} data-state={health.state==="ready"?"success":health.state==="checking"?"unknown":"error"}><h3>Account API & database</h3><strong>{health.state==="checking"?"Checking…":health.state==="ready"?"Responding":health.state==="database"?"Database unavailable":"API check failed"}</strong><p>{health.state==="ready"?"Health endpoint confirmed a database connection.":health.state==="database"?"The server responded but could not connect to the database.":"A failed check can mean a cold start, network problem or outage. It does not confirm a global outage."}</p></article>
    <article className={healthStyles.card} data-state={overview.aiConfigured===false?"error":"unknown"}><h3>Hosted AI configuration</h3><strong>{overview.aiConfigured===true?"Configured":overview.aiConfigured===false?"Not configured":"Not measured for this backend"}</strong><p>Configuration is not a successful inference test. Refreshing does not spend AI requests.</p></article>
   </div><p>Checks run on page load or Refresh status, not in the background. {health.at?`Health checked: ${health.at}.`:""} No automatic outage alerts are enabled.</p><a href="https://status.render.com/" target="_blank" rel="noopener noreferrer">Render platform status ↗</a></section>
   <section className={styles.panel} id="allowance"><h2>AI allowance & recent results</h2><div className={healthStyles.card} data-state={allowance?.state==="exhausted"?"error":allowance?.state==="low"?"limited":"unknown"}><h3>{allowanceTitle}</h3>{allowance?.limit!==null&&allowance?.limit!==undefined?<><p><strong>{allowance.remaining} project tutor reservations remain</strong> within the current request/token caps. {allowance.used} shared requests reserved out of {allowance.limit} today (UTC).</p><progress aria-label="Shared project request allowance used" value={Math.min(allowance.used??0,allowance.limit)} max={allowance.limit}/><p>Per-learner daily cap: {allowance.accountLimit}. A learner can reach their own limit while the project still has capacity. App daily counters reset at 00:00 UTC.</p></>:<p>No supported allowance measurement is available. Do not interpret this as unlimited or exhausted.</p>}</div>
    <div className={healthStyles.grid}>{([['tutor','AI tutor'],['whisper','Speech recognition']] as const).map(([key,label])=>{const result=overview.providerResults?.[key];return <article key={key} className={healthStyles.card} data-state={result?.state??"unknown"}><h3>{label}</h3><strong>{latest(result)}</strong>{result&&<p>{result.at} · {(result.durationMs/1000).toFixed(2)}s for that request</p>}<p>{result?.state==="limited"?"HTTP 429 can mean provider rate limits or quota limits. The response does not confirm which.":"Provider response result only, not a live check, final-answer validation or average latency."}</p></article>;})}</div>
    <p>Cloudflare's own free allocation is separate from Saegim's caps. Remaining app requests do not guarantee provider availability. These two provider observations reset when this API process restarts; no conversations or recordings are stored here. TTS runs on the learner's device or uses recorded clips and is not verified by these server checks.</p>
   </section>
   <section className={styles.panel} id="traffic"><h2>Traffic & page performance</h2><p>Live visits, referral sources, browser/device categories and page performance are in Cloudflare's separately authenticated dashboard.</p><a href="https://dash.cloudflare.com/5bf46673f1ec63063b8ed109c6ec0072/web-analytics/overview?siteTag~in=ad8cd0087dd04c8b97b9e8ec5910e488&excludeBots=Yes" target="_blank" rel="noopener noreferrer">Open Cloudflare analytics ↗</a></section>
   <section className={styles.panel} id="history"><h2>Usage history · UTC</h2><p>Existing budget reservations, including failed calls. These are not successful conversations, unique people or exact costs. Snapshot: {overview.measuredAt}.</p><details><summary>Show the last 30 days with recorded reservations</summary><div style={{overflowX:"auto"}}><table><caption>Project quota reservations</caption><thead><tr><th scope="col">Date</th><th scope="col">All requests</th><th scope="col">Tutor requests</th></tr></thead><tbody>{overview.usage.map(day=><tr key={day.date}><th scope="row">{day.date}</th><td>{day.requests}</td><td>{day.tutorRequests}</td></tr>)}</tbody></table></div>{!overview.usage.length&&<p>No reservations in this period.</p>}</details></section>
   <section className={styles.panel} id="experiments"><h2>Experiments</h2><p>Feature popularity and latency charts below still use synthetic data. They do not measure real learners.</p><button aria-expanded={demo} onClick={()=>setDemo(v=>!v)}>{demo?"Hide analytics demo":"Open analytics demo"}</button></section>
  </>}
 </main>{overview&&demo&&<AnalyticsPreview/>}</>;
}
