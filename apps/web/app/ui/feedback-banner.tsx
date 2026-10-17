import feedback from "../feedback-config.json";

export function FeedbackBanner({ compact = false }: { compact?: boolean }) {
  return <aside className={`feedback-banner${compact ? " feedback-banner-compact" : ""}`} aria-label="Help improve Saegim">
    <div><span className="feedback-beta-label">BETA · BUILT WITH YOU</span><p>{compact ? "Have an idea or spotted a bug? Help shape your next lesson." : "Your Korean journey helps shape ours. Tell us what works—and what could feel better."}</p></div>
    <a href={feedback.url} target="_blank" rel="noopener noreferrer">Share feedback <span aria-hidden="true">↗</span><span className="feedback-link-note">Opens Google Form</span></a>
  </aside>;
}
