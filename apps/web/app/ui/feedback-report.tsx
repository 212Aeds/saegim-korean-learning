"use client";
import { useState } from "react";
import { makeFeedbackReport } from "./feedback-report-text";

export function FeedbackReport({area, publishing}: {area: string; publishing: boolean}) {
  const [title,setTitle] = useState("");
  const [steps,setSteps] = useState("");
  const [expected,setExpected] = useState("");
  const report = makeFeedbackReport({area,publishing,title,steps,expected});
  const ready = title.trim().length >= 5 && steps.trim().length >= 10;
  function download() {
    const url = URL.createObjectURL(new Blob([report],{type:"text/plain;charset=utf-8"}));
    const link = document.createElement("a"); link.href=url; link.download="saegim-feedback.txt"; link.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <details className="feedback-report">
    <summary>Something feel off? Report a problem</summary>
    <div className="feedback-report-body"><h3>Help Saegim grow.</h3><p>Audio, wording, layout, or something else—tell us what happened. No account details or conversations are attached automatically.</p>
      <label>A short title<input value={title} onChange={event=>setTitle(event.target.value)} maxLength={100} placeholder="For example: the audio stops early"/></label>
      <label>What happened? How can we repeat it?<textarea value={steps} onChange={event=>setSteps(event.target.value)} maxLength={1500} rows={4}/></label>
      <label>What did you expect? (optional)<textarea value={expected} onChange={event=>setExpected(event.target.value)} maxLength={1000} rows={2}/></label>
      <details><summary>Preview your report</summary><pre>{report}</pre></details>
      <div className="feedback-report-actions"><button type="button" className="button button-soft" disabled={!ready} onClick={download}>Download report</button>
        {ready && <a className="button button-dark" href={`https://github.com/212Aeds/sori-korean-learning/issues/new?title=${encodeURIComponent(title.trim())}&body=${encodeURIComponent(report)}`} target="_blank" rel="noopener noreferrer">Review on GitHub ↗</a>}</div>
      <small>GitHub reports are public and require a GitHub account. The link opens a draft; review it before submitting. You can download the report instead.</small>
    </div>
  </details>;
}
