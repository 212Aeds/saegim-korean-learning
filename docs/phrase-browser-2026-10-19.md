# Phrase browser and contextual lessons

Replaced the full-deck native dropdown with a collapsed browser, topic filter, Korean/English/romanization search, and six results per page. Choosing a result closes the panel and returns focus to the trigger. Escape closes it; pagination is bounded and empty searches can be cleared. Filters stack below 520px; Korean and translations wrap, touch controls have 44px targets, and motion respects reduced-motion preferences.

Added 24 app-authored phrases and moved the existing eight connected-opinion cards into a shared lesson source. Eight companion lessons teach four phrases each, with four contextual meaning questions and two target-wording recalls. Lessons require the corresponding greeting, cafe, transport, family, or opinion material. Alphabet and word placements retain their existing separation. Advanced speaking has 16 connected phrases grouped across four topics; legacy opinion IDs and progress remain valid.

Prepared 60 additional static audio clips locally, including newly introduced focus words, with the existing Chris/Jessica Supertonic presets. The 1,138-clip catalog is checked for both-voice coverage. No provider, microphone timing, billing, authentication, or quota settings changed. Dictionary lookup/reference components remain available and app-authored examples retain their pending editorial status.

Verification: phrase filtering/pagination/search and level/lesson integration tests; complete course progress schema round-trip; complete audio coverage audit; hosted production build; browser interaction and layout checks before deployment.
