"use client";
import {useEffect,useState} from "react";
import dynamic from "next/dynamic";
import {publicApiUrl} from "../release";
import styles from "../analytics-preview/preview.module.css";
const AnalyticsPreview=dynamic(()=>import("../analytics-preview/preview").then(m=>m.AnalyticsPreview));
type Overview={usage:{date:string;requests:number;tutorRequests:number}[];measuredAt:string};
export function DeveloperSection(){
 const [overview,setOverview]=useState<Overview|null>(null),[state,setState]=useState("Checking your developer access…"),[demo,setDemo]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{if(!publicApiUrl){setState("Developer access requires the connected account API.");return;}const controller=new AbortController();let active=true;const timer=setTimeout(()=>controller.abort(),75000);
  void fetch(`${publicApiUrl}/v1/developer/overview`,{credentials:"include",cache:"no-store",signal:controller.signal}).then(async response=>{if(!response.ok){if(active)setState(response.status===401?"Sign in to your owner account on the home page, then return here.":response.status===403?"This section is restricted to the developer account.":"Developer data is unavailable. Please retry shortly.");return;}const data=await response.json() as Overview;if(active){setOverview(data);setState("");}}).catch(()=>{if(active)setState("The account service did not respond. Your learning data is unchanged; try again shortly.");}).finally(()=>clearTimeout(timer));return()=>{active=false;clearTimeout(timer);controller.abort();};
 },[attempt]);
 return <><main className={styles.lab}><a href="/">← Back to Saegim</a><span className={styles.badge}>DEVELOPER · PRIVATE ACCOUNT ACCESS</span><h1>Your beta control room.</h1>
 {!overview?<section className={styles.panel}><p role="status">{state}</p><button onClick={()=>{setState("Checking your developer access…");setAttempt(n=>n+1);}}>Retry access check</button></section>:<>
 <section className={styles.panel}><h2>Visits & page performance</h2><p>Cloudflare contains the live visit, referral, device and page-loading reports. Its dashboard requires your Cloudflare sign-in.</p><a href="https://dash.cloudflare.com/5bf46673f1ec63063b8ed109c6ec0072/web-analytics/overview?siteTag~in=ad8cd0087dd04c8b97b9e8ec5910e488&excludeBots=Yes" target="_blank" rel="noopener noreferrer">Open Cloudflare analytics ↗</a></section>
 <section className={styles.panel}><h2>Existing AI quota reservations · UTC</h2><p>These are budget reservations, including some failed requests. They are not successful conversations, unique people or exact costs. No learner records are displayed.</p><div style={{overflowX:"auto"}}><table><caption>Last 30 days with recorded project reservations</caption><thead><tr><th scope="col">Date</th><th scope="col">All requests</th><th scope="col">Tutor requests</th></tr></thead><tbody>{overview.usage.map(day=><tr key={day.date}><th scope="row">{day.date}</th><td>{day.requests}</td><td>{day.tutorRequests}</td></tr>)}</tbody></table></div>{!overview.usage.length&&<p>No reservations in this period.</p>}<p>Snapshot: {overview.measuredAt}. Refresh this page for a new snapshot.</p></section>
 <section className={styles.panel}><h2>Experiments stay separate</h2><p>Feature counts, playback latency and uptime alerts are still a proposal. The demo below uses synthetic data only; no new telemetry or monitoring has been enabled.</p><button aria-expanded={demo} onClick={()=>setDemo(v=>!v)}>{demo?"Hide analytics demo":"Open analytics demo"}</button></section>
 </>}</main>{overview&&demo&&<AnalyticsPreview/>}</>;
}
