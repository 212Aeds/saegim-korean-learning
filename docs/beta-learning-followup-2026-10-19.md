# Practical learning follow-up

Spoken wording mismatches now wait for explicit learner confirmation before calling the lesson grading callback. A matching transcript still submits normally; a written answer is an explicit submission. Retry and edit are available without treating an uncertain recognition result as a confirmed wrong answer. There is no automatic credit for claiming the recognizer was wrong. The confirmation button consumes the pending transcript once. Existing saved scores are not recalculated.

The explanation tutor offers a reference selector limited to the last four known completed lesson IDs. Requests use authored focus/explanation/example and a small vocabulary set, with bounded prior-dialogue context. Unknown or uncompleted selections use general mode. The API contract and provider configuration are unchanged. This gives grounding, not a guarantee of model accuracy.

Practical goals link existing lessons for introductions, family, café requests and finding places. Completed steps are counted using unique valid IDs; self-rated repeated recall is displayed separately and never called mastery. Goal buttons use existing prerequisite and placement rules. No new proficiency credential or progress schema.

Verification uses synthetic text, review items and authored lessons. No microphone recording, private data export, provider/model upgrade, paid fallback, account migration, donation link or email sending. Physical-device speech tests and native-speaker editorial review still require outside validation. Current branding remains unchanged pending owner decision and remaining name clearance.
