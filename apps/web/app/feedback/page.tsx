import type {Metadata} from "next";
import {PublicGuideShell} from "../ui/public-guide-shell";
import {FeedbackInvite} from "../ui/feedback-invite";

export const metadata:Metadata={title:"Beta feedback | Saegim",description:"Help improve Saegim’s Korean lessons, audio and conversations. Share a bug or suggestion through our feedback form."};
export default function FeedbackPage(){return <PublicGuideShell><div className="feedback-page"><h1>Your next small win helps shape Saegim.</h1><p>Saegim is in beta. Your experience helps us find what needs a little more care.</p><FeedbackInvite/><h2>What makes a helpful report?</h2><p>Tell us which section you used, what you did, what happened, and what you expected. For audio or layout issues, your device and browser can help us reproduce the problem.</p><p>Learning remains available if you choose not to send feedback. The form opens on Google, whose privacy policy applies.</p></div></PublicGuideShell>;}
