export function BetaChecklist() {
  return <section className="beta-checklist" aria-labelledby="beta-checklist-title">
    <span className="micro-label">TRY A SMALL TEST RUN</span>
    <h2 id="beta-checklist-title">Help us make the next lesson better.</h2>
    <p>Choose a few tasks below. Tell us where you got stuck, what felt confusing, or what made you want to continue.</p>
    <fieldset><legend>Your testing checklist</legend>
      <label><input type="checkbox"/><span><strong>Find your starting point</strong>Choose your Korean level. Does your recommended lesson fit what you already know?</span></label>
      <label><input type="checkbox"/><span><strong>Finish a lesson</strong>Try a wrong answer and then correct it. Is the explanation helpful?</span></label>
      <label><input type="checkbox"/><span><strong>Listen and speak</strong>Try both voices, change the pace, and stop playback. If you use the microphone, check that the transcript matches what you said.</span></label>
      <label><input type="checkbox"/><span><strong>Come back to your progress</strong>Reload the app and check that your completed lesson is still there. Review a card and try it again.</span></label>
      <label><input type="checkbox"/><span><strong>Try the tutor</strong>Ask a Korean question or start a short conversation at your level. Flag answers that seem incorrect or unclear.</span></label>
    </fieldset>
    <p className="beta-checklist-note">Checkmarks are just for this visit and do not change your learning progress. Skip anything you prefer not to test. Please leave out passwords, private conversations, and personal information.</p>
    <a className="button button-soft" href="/">Open Saegim to try it <span aria-hidden="true">↗</span></a>
  </section>;
}
