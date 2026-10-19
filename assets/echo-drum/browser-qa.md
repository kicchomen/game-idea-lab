# Browser verification — 2026-10-19

Cloud Chromium, ordinary user controls; no game-state injection. Not a physical phone or novice-human test.

- Standalone actual keyboard sequence completed all three phrases: 15/15 hits, 0 errors, success screen.
- Failed attempt reached 0/15, 4 errors and failure screen. Retry reset score. Success retry also reset. P pause/resume and repeated input tested.
- Width fixture 320/360/390 CSS px: visible layout inspected, no horizontal overflow (client/scroll widths 305/305, 360/360, 375/375). 320px pointer hit succeeded; 360px held Space generated one hit rather than repeated hits; 390px restart restored ready state.
- Exact saved Blogger article HTML tested in 320/360/390px srcdoc fixtures. Images loaded at native 1400x788 and1200x800; embed and standalone URLs correct. Nested game started and paused at each width. Article fixture is not the entire Blogger theme.
- Actual Blogger smartphone preview (412px preset) visually inspected: readable cover, article and controls; embedded start/pause worked.
- Saved Blogger HTML was reloaded and matched final article.html exactly (1725 characters).
- Published article title, canonical URL, cover/OG image, both CDN images and embedded start/pause verified. Blogger list showed14 published,2 drafts,0 scheduled. Sensor Shift and Footstep Echo remained drafts.

Independent review found an overlapping timing-window bug: choosing nearest note could steal the next note. Changed matching to earliest eligible note; regression at +160ms now passes. Canvas accessible description corrected. Retry wording corrected in article. Full automated suite:416 passes. See test-output.txt and independent-review.md.

Source Pages deployment5423023f306d2ad3f6a3450f7bbfeee374110fde and article-fixture deployment28efdc7697d038ce44a00a59940fdc5d6c5b967c both succeeded before publication.

Unverified: physical mobile devices, human first-play comprehension, screen reader, long-term enjoyment/depth. Audio is intentionally absent and disclosed; response retains a visible guide. No educational effect claimed.
