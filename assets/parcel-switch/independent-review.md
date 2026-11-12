# Independent review — 2026-11-12

Reviewer scope: engine and UI source inspection, article source inspection, independently authored Node tests and mock-DOM UI simulation. **This is not actual browser rendering/input QA**, not physical-phone testing, and not human first-look/play-fun assessment.

## Result
Source/logic review passes after the implementation author's fixes below. Publication is still gated by parent-run actual browser operations, responsive screenshots, CDN replacement/readback, deployed-source verification and Blogger preview checks.

## Findings and fixes verified
1. **Required correction: red parcel left the visible belt.** The red route position originally interpolated directly from (130,135) to (45,286), but the drawn belt bends at (45,210). Author changed to piecewise travel through that point. Added independent regression checking the first parcel at 4.5 seconds is at x=45, y≈238.5. Pass.
2. Pause/retry controls were 38px, 36px in landscape. Author increased both to 44px. Verified CSS.
3. Switch accessible names only named the action, not current route. Author now announces current destination and next toggle destination. Independent UI mock test verifies changed route updates accessible name.
4. UI initially used こづつみ分岐便 while article used 小包の分岐番. Parent should keep one chosen name across UI, article and generated cover. This is a presentation consistency check, not an engine blocker.

## Independent tests
Added `tests/parcel-switch-review.test.cjs`: 13 tests, alongside author's 10 tests = **23 focused tests passing**.
- Public `flip` API-only simulated operator reaches 18/18 correct without assigning game state.
- Two errors allow completion; third ends the game before all 18.
- First-fork just-before/just-after crossing, locked wrong routes, large finite delta, invalid controls, frozen sequence, reset object identity/replay and repeated pause/resume.
- Mock-DOM app execution: ready instructions remain stopped, start reveals game, repeated key events are ignored, window blur pauses, explicit resume continues, restart resets route/score, no-input loss and repeat loss work, corrected red path and dynamic accessible labels.

## Article review
`article-draft.html` correctly separates implemented 2 forks / 3 destinations / fixed 18 parcels from future varied intervals, priority parcels and alternative layouts. Win condition (at most two mistakes while processing all 18) matches code. Symbols are used alongside colors. Long-term variety, device and human evaluation are not promised. `COVER_CDN_PENDING` and `GAMEPLAY_CDN_PENDING` are deliberate blocking placeholders; do not publish with them or claim actual screenshot before capture.

## Remaining limitations
- Fixed target sequence is learnable; theoretical extension is not evidence of sustained depth.
- Operator simulation proves reachability, not human reaction accessibility or fun.
- Pause overlay covers the belt, so the article's “停止して考える” means strategy/rules rather than unobscured frozen-board inspection.
- Actual cloud-browser success/failure/retry, pointer/keyboard input, 320/360/390px and heights, article embed and no-clipping checks remain the publisher's gate.
