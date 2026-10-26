import feedback from "../feedback-config.json";

export function FeedbackBanner({ compact = false }: { compact?: boolean }) {
  return <aside className={`feedback-banner${compact ? " feedback-banner-compact" : ""}`} aria-label="Help improve Saegim">
    <div><span className="feedback-beta-label">BETA · BUILT WITH YOU</span><p>{compact ? "What helped, or where did you get stuck? Feedback is optional." : "Help shape the beta: tell us what helped, where you got stuck, or what you want to learn next."}</p></div>
    <a href={feedback.url} target="_blank" rel="noopener noreferrer">Share feedback <span aria-hidden="true">↗</span><span className="feedback-link-note">Opens Google Form</span></a>
  </aside>;
}
