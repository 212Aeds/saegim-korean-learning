"use client";
import { hostedAiEnabled } from "../release";
import { useState } from "react";
import { makeFeedbackReport } from "./feedback-report-text";
import { copyFeedbackReport } from "./copy-feedback-report";
import { FeedbackInvite } from "./feedback-invite";
import feedback from "../feedback-config.json";

export function FeedbackReport({area, publishing, showInvite = true}: {area: string; publishing: boolean; showInvite?: boolean}) {
  const [title,setTitle] = useState("");
  const [steps,setSteps] = useState("");
  const [expected,setExpected] = useState("");
  const [copyStatus,setCopyStatus] = useState("");
  const [copying,setCopying] = useState(false);
  const report = makeFeedbackReport({area,publishing,hosted:hostedAiEnabled,title,steps,expected});
  const ready = title.trim().length >= 5 && steps.trim().length >= 10;
  async function copy() {
    setCopying(true);
    const result = await copyFeedbackReport(report,navigator.clipboard);
    setCopyStatus(result === "copied" ? "Copied. Paste your report into the feedback form." : "Copy is unavailable. Download your report, or select the text in Preview your report.");
    setCopying(false);
  }
  function download() {
    const url = URL.createObjectURL(new Blob([report],{type:"text/plain;charset=utf-8"}));
    const link = document.createElement("a"); link.href=url; link.download="saegim-feedback.txt"; link.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <details className="feedback-report">
    <summary>Something feel off? Report a problem</summary>
    {showInvite && <FeedbackInvite />}
    <div className="feedback-report-body"><h3>Help Saegim grow.</h3><p>Audio, wording, layout, or something else—tell us what happened. No account details or conversations are attached automatically.</p>
      <label>A short title<input value={title} onChange={event=>{setTitle(event.target.value);setCopyStatus("");}} maxLength={100} placeholder="For example: the audio stops early"/></label>
      <label>What happened? How can we repeat it?<textarea value={steps} onChange={event=>{setSteps(event.target.value);setCopyStatus("");}} maxLength={1500} rows={4}/></label>
      <label>What did you expect? (optional)<textarea value={expected} onChange={event=>{setExpected(event.target.value);setCopyStatus("");}} maxLength={1000} rows={2}/></label>
      <details><summary>Preview your report</summary><pre>{report}</pre></details>
      <p role="status" aria-live="polite">{copyStatus}</p>
      <div className="feedback-report-actions"><button type="button" className="button button-dark" disabled={!ready || copying} onClick={()=>void copy()}>{copying ? "Copying…" : "Copy report"}</button><button type="button" className="button button-soft" disabled={!ready} onClick={download}>Download report</button>
        {ready && <a className="button button-dark" href={feedback.url} target="_blank" rel="noopener noreferrer">Open feedback form ↗</a>}</div>
      <small>Download a copy for yourself, or paste the details into our feedback form. Nothing is sent automatically.</small>
    </div>
  </details>;
}
