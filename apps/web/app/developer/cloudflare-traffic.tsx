"use client";
import {useEffect,useState} from "react";
import {parseTraffic,type TrafficSnapshot} from "./traffic-report";
import {reportTime} from "./report";
import styles from "./health.module.css";
const cloudflareUrl="https://dash.cloudflare.com/5bf46673f1ec63063b8ed109c6ec0072/web-analytics/overview?siteTag~in=ad8cd0087dd04c8b97b9e8ec5910e488&excludeBots=Yes";
const milliseconds=(n:number|null)=>n===null?"No samples":`${Math.round(n).toLocaleString()} ms`;
export function CloudflareTraffic({apiUrl}:{apiUrl:string}){
 const [report,setReport]=useState<TrafficSnapshot|null>(null),[notice,setNotice]=useState(""),[pending,setPending]=useState(true),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  if(!apiUrl){setPending(false);setNotice("Connect the account API to read traffic.");return;}
  const controller=new AbortController();let active=true;const timer=setTimeout(()=>controller.abort(),12000);setPending(true);setNotice("");
  void fetch(`${apiUrl}/v1/developer/traffic`,{credentials:"include",cache:"no-store",signal:controller.signal}).then(async response=>{
   if(response.status===401||response.status===403){if(active){setReport(null);setNotice("Sign in to your owner account to read traffic.");}return;}
   if(!response.ok)throw Error("Traffic unavailable");
   const data=parseTraffic(await response.json());if(!data)throw Error("Invalid traffic report");if(active)setReport(data);
  }).catch(()=>{if(active){setReport(previous=>previous?.data?{...previous,state:"stale"}:null);setNotice("Traffic could not be refreshed. Any previous snapshot is out of date.");}}).finally(()=>{clearTimeout(timer);if(active)setPending(false);});
  return()=>{active=false;clearTimeout(timer);controller.abort();};
 },[apiUrl,attempt]);
 const data=report?.data;
 return <><div className={styles.sectionHeading}><div><span className={styles.badge}>CLOUDFLARE · LAST 24 HOURS</span><h2>Visitors & page performance</h2></div><button disabled={pending} onClick={()=>setAttempt(n=>n+1)}>{pending?"Loading traffic…":"Refresh traffic"}</button></div>
  {notice&&<p role="status" className={styles.notice}>{notice}</p>}
  {report?.state==="unconfigured"&&<p role="status">The read-only analytics connection is not configured. No traffic total is available here yet.</p>}
  {report?.state==="unavailable"&&<p role="status">Cloudflare analytics is unavailable. This does not mean there were zero visits. Try again later.</p>}
  {data&&<><p role="status" className={styles.caption}>{report!.state==="stale"?"Out-of-date snapshot":pending?"Refreshing · previous snapshot shown":"Last synced"} · {reportTime(report!.measuredAt!)}. Window: {reportTime(report!.periodStart!)} – {reportTime(report!.periodEnd!)}.</p>
   <dl className={styles.trafficMetrics}><div><dt>Visits</dt><dd>{data.visits.toLocaleString()}</dd></div><div><dt>Page views</dt><dd>{data.pageViews.toLocaleString()}</dd></div><div><dt>Average page load</dt><dd>{milliseconds(data.pageLoadAvgMs)}</dd></div><div><dt>LCP · p75</dt><dd>{milliseconds(data.lcpP75Ms)}</dd></div><div><dt>INP · p75</dt><dd>{milliseconds(data.inpP75Ms)}</dd></div><div><dt>Layout shift · p75</dt><dd>{data.clsP75===null?"No samples":data.clsP75.toFixed(3)}</dd></div></dl>
   <p className={styles.caption}>Page-load p75: {milliseconds(data.pageLoadP75Ms)} · {data.performanceSamples.toLocaleString()} page-performance samples · {data.vitalSamples.toLocaleString()} Web Vitals samples. Small samples are not representative of every visitor.</p>
   <div className={styles.breakdowns}>{([['referrals','Top referral hosts','visits'],['devices','Top device categories','page views'],['browsers','Top browsers','page views'],['countries','Top countries','page views']] as const).map(([key,title,unit])=><article className={styles.card} key={key}><h3>{title}</h3>{data[key].length?<ul>{data[key].map((row,index)=><li key={`${row.label}-${index}`}><span>{row.label}</span><strong>{row.count.toLocaleString()} <small>{unit}</small></strong></li>)}</ul>:<p>No recorded groups.</p>}</article>)}</div>
  </>}
  <p className={styles.caption}>Visits are not unique people. Bots are excluded by the query. Browser privacy choices, blockers and sampling can affect counts. Developer and preview pages are excluded from future collection; older counts can include them. Server snapshots are cached for five minutes; refresh does not force a new Cloudflare query.</p>
  <a href={cloudflareUrl} target="_blank" rel="noopener noreferrer">Open full Cloudflare report ↗</a>
  <details><summary>Metric definitions & privacy</summary><p>LCP measures largest-content rendering; INP measures interaction responsiveness; layout shift measures unexpected movement. p75 means the 75th percentile. These measure pages, not AI generation, microphone accuracy or TTS playback. Only aggregate counts, host referrals and broad device/browser/country groups are read; no new learner events are collected. In-app learning tabs are not separate feature events.</p></details>
 </>;
}
