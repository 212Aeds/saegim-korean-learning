import feedback from "../feedback-config.json";

export function FeedbackInvite() {
  return <section className="feedback-invite" aria-label="Share beta feedback">
    <a className="feedback-qr" href={feedback.url} target="_blank" rel="noopener noreferrer" aria-label="Open the Saegim feedback form">
      <img src={feedback.qrAsset} width={156} height={156} alt="QR code linking to the Saegim feedback form" loading="eager" />
    </a>
    <div><span className="micro-label">HELP SAEGIM GROW</span><h2>Help improve Saegim.</h2>
      <p>Found a bug, a confusing lesson, or an idea worth sharing? Scan the code or open our short feedback form.</p>
      <a className="button button-dark" href={feedback.url} target="_blank" rel="noopener noreferrer">Share feedback ↗</a>
      <p className="feedback-note">Google Form · no email required · responses stay private to the creator. Please leave out passwords and personal information.</p>
      <a className="feedback-download" href={feedback.qrAsset} download="saegim-feedback-qr.svg">Download QR code</a>
    </div>
  </section>;
}
