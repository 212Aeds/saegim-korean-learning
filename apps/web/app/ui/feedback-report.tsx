"use client";
import { hostedAiEnabled } from "../release";
import { useState } from "react";
import { makeFeedbackReport } from "./feedback-report-text";
import {feedbackFormUrl} from "./feedback-form-url";
import { FeedbackInvite } from "./feedback-invite";


export function FeedbackReport({area, publishing, showInvite = true}: {area: string; publishing: boolean; showInvite?: boolean}) {
  const [title,setTitle] = useState("");
  const [steps,setSteps] = useState("");
  const [expected,setExpected] = useState("");

  const report = makeFeedbackReport({area,publishing,hosted:hostedAiEnabled,title,steps,expected});
  const ready = title.trim().length >= 5 && steps.trim().length >= 10;
  return <details className="feedback-report">
    <summary>Something feel off? Report a problem</summary>
    {showInvite && <FeedbackInvite />}
    <div className="feedback-report-body"><h3>Help Saegim grow.</h3><p>Audio, wording, layout, or something else—tell us what happened. No account details or conversations are attached automatically.</p>
      <label>A short title<input value={title} onChange={event=>{setTitle(event.target.value);}} maxLength={100} placeholder="For example: the audio stops early"/></label>
      <label>What happened? How can we repeat it?<textarea value={steps} onChange={event=>{setSteps(event.target.value);}} maxLength={1500} rows={4}/></label>
      <label>What did you expect? (optional)<textarea value={expected} onChange={event=>{setExpected(event.target.value);}} maxLength={1000} rows={2}/></label>
      <details><summary>Preview your report</summary><pre>{report}</pre></details>
      <div className="feedback-report-actions">{ready?<a className="button button-dark" href={feedbackFormUrl(report,area)} target="_blank" rel="noopener noreferrer">Review &amp; send report ↗</a>:<p>Add a short title and a few details to prepare your report.</p>}</div>
      <small>Your report opens already filled in on Google Forms. Review it and press Submit there. No downloading or copying is needed. The name defaults to Anonymous Saegim learner; you can change it in the form. Avoid personal information; your report text will be included in the form link you open.</small>
    </div>
  </details>;
}
