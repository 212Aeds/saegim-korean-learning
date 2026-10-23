import type {Metadata} from "next";
import {PublicGuideShell} from "../ui/public-guide-shell";
import {FeedbackReport} from "../ui/feedback-report";
import {freePublishing} from "../release";
import {BetaChecklist} from "../ui/beta-checklist";
import {FeedbackInvite} from "../ui/feedback-invite";

export const metadata:Metadata={title:"Beta feedback | Saegim",description:"Help improve Saegim’s Korean lessons, audio and conversations. Share a bug or suggestion through our feedback form."};
export default function FeedbackPage(){return <PublicGuideShell><div className="feedback-page"><h1>Share your experience with Saegim.</h1><p>Saegim is in beta. Your experience helps us find what needs improvement.</p><FeedbackInvite/><BetaChecklist/><FeedbackReport area="public website" publishing={freePublishing} showInvite={false}/><h2>What makes a helpful report?</h2><p>Tell us which section you used, what you did, what happened, and what you expected. For audio or layout issues, your device and browser can help us reproduce the problem.</p><p>Learning remains available if you choose not to send feedback. The form opens on Google, whose privacy policy applies.</p></div></PublicGuideShell>;}
