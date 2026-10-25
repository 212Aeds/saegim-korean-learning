"use client";
import {useState} from "react";
import {availability,demoEvents,features,summarize,type Feature,type Measurement} from "./model";
import styles from "./preview.module.css";
const labels: Record<Feature,string>={today:"Today",learn:"Learn",practice:"Practice",review:"Review",words:"Words",speak:"Speak",tutor:"AI Tutor"};
const duration=(n:number|null)=>n===null?"No samples":`${(n/1000).toFixed(2)}s`;
export function AnalyticsPreview(){
 const [events,setEvents]=useState<Measurement[]>(demoEvents),[selected,setSelected]=useState<Feature>("tutor"),[checks,setChecks]=useState<boolean[]>([true]),[notice,setNotice]=useState("Sample activity loaded. Nothing is being tracked.");
 const report=summarize(events),row=report.rows.find(r=>r.feature===selected)!,status=availability(checks);
 function add(outcome:Measurement["outcome"],milliseconds:number){setEvents(previous=>[...previous,{feature:selected,outcome,milliseconds}]);setNotice(`Added a simulated ${outcome} for ${labels[selected]}.`);}
 return <main className={styles.lab}>
  <header><a href="/">← Saegim</a><span className={styles.badge}>LOCAL PREVIEW · SYNTHETIC DATA</span><h1>Understand what needs attention.</h1><p>A private working model of feature usage, speed and availability. All numbers below are invented test fixtures, not real visitors.</p></header>
  <aside className={styles.notice}>Live analytics is unchanged. No accounts, recordings, conversations or requests to your servers are used in this lab. Refreshing resets the demo.</aside>
  <section className={styles.panel} aria-labelledby="usage"><h2 id="usage">Which features get used?</h2><p>Sample action counts, not unique people or time spent. More actions do not necessarily mean more learning.</p>
  <div className={styles.bars}>{[...report.rows].sort((a,b)=>b.count-a.count).map(r=><button key={r.feature} type="button" aria-pressed={selected===r.feature} onClick={()=>setSelected(r.feature)}><span>{labels[r.feature]}</span><span className={styles.track}><span style={{width:`${r.count/Math.max(1,...report.rows.map(x=>x.count))*100}%`}}/></span><strong>{r.count}</strong></button>)}</div></section>
  <section className={styles.panel} aria-labelledby="performance"><h2 id="performance">{labels[selected]} · speed & reliability</h2><label>Inspect a feature <select value={selected} onChange={e=>setSelected(e.target.value as Feature)}>{features.map(f=><option value={f} key={f}>{labels[f]}</option>)}</select></label>
   <dl className={styles.metrics}><div><dt>Completed successfully</dt><dd>{row.successRate===null?"No samples":`${row.successRate}%`}</dd></div><div><dt>Typical wait · p50</dt><dd>{duration(row.p50)}</dd></div><div><dt>Slower end · p95</dt><dd>{duration(row.p95)}</dd></div><div><dt>Failures / cancellations</dt><dd>{row.failure} / {row.cancelled}</dd></div></dl>
   <p>Wait times cover successful simulated actions. Cancellations are separate from errors. In a real implementation, AI response, transcription and playback-start times would be measured separately.</p>
   <div className={styles.controls}><button onClick={()=>add("success",800)}>Simulate quick success</button><button onClick={()=>add("success",10000)}>Simulate 10s wait</button><button onClick={()=>add("failure",5000)}>Simulate failure</button><button onClick={()=>add("cancelled",2000)}>Simulate cancellation</button></div>
  </section>
  <section className={styles.panel} aria-labelledby="availability"><h2 id="availability">Is the website available?</h2><p className={styles.status}>{status==="up"?"● Available":status==="down"?"! Unavailable":status==="recovered"?"↻ Recovered after retry":"— Not checked"}</p><p>{status==="recovered"?"A retry succeeded. This could be a cold start or transient failure; it does not erase the initial delay.":status==="down"?"Two sample checks failed. A real alert would link to deployment status and a troubleshooting guide.":"This is a simulated check, not a live uptime claim."}</p>
   <div className={styles.controls}><button onClick={()=>{setChecks([true]);setNotice("Simulated a healthy check.");}}>Healthy</button><button onClick={()=>{setChecks([false,true]);setNotice("Simulated a slow recovery.");}}>Slow recovery</button><button onClick={()=>{setChecks([false,false]);setNotice("Simulated an outage. No alert was sent.");}}>Outage</button></div><p>Future checks would test the public page and database health separately. They would not prove every lesson, AI response, microphone or phone speaker works.</p>
  </section>
  <section className={styles.panel}><h2>You control what gets adopted.</h2><p>Proposed live collection: fixed action names and duration buckets, daily aggregates, 30-day retention, browser privacy opt-outs, and no individual profiles or session replay. A local report would be available to the owner; this preview is not a secured admin dashboard.</p><div className={styles.controls}><button onClick={()=>{setEvents([]);setChecks([]);setNotice("Cleared sample data in this preview only.");}}>Try empty data</button><button onClick={()=>{setEvents(demoEvents);setChecks([true]);setSelected("tutor");setNotice("Reset the sample dashboard.");}}>Reset demo</button></div></section>
  <p role="status" aria-live="polite" className={styles.notice}>{notice}</p><footer>Preview only. No real monitoring, email alerts, data collection, or payments are enabled here.</footer>
 </main>;
}
