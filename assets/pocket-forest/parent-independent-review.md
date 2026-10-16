# Independent review — 2026-10-16

Reviewer: parent, separate from initial implementation worker. Not a human first-use playtest.

## Confirmed defect and repair
- `Engine.preview` omitted `beforeHabitats`, although the controller reads it for population changes. The existing test suite failed at `tests.js:68`, and the UI also relied on the missing field.
- The parent added `beforeHabitats: result.beforeHabitats` to the successful preview result. `node tests.js` then passed deterministic supply, legal/invalid moves, four habitat rules, live score loss, undo/replay, authored win/loss routes and end freeze.

## Further required checks
- Pointer entry currently changes selected cell. Moving the mouse from a clicked cell toward the placement button can silently change the intended target. Keep hover separate or remove the pointerenter selection; verify mouse placement and keyboard behavior.
- Explain the actual select-cell → 「この場所に置く」 operation. Do not imply a cell tap alone commits the move.
- The first cover image contains deer/rabbit/squirrel/blue birds, absent from the current four species. Preserve the style but match the pictured animals to fox/frog/bee/owl, then visually review again.
- The concept illustration matches forest/flower/pond and select/place/connect. It is a concept, not a literal screen capture or ecological claim.
- Article structure passes: top landscape cover, early description as game idea/prototype, concept then playable embed, short operations, implemented scope separate from future plans. Replace the provisional verification paragraph with actual results.

## Not yet approved
Browser operation at desktop and 320/360/390px, success/failure/retry/repeated inputs, final cover, Pages delivery, Blogger save/reload/embed and public-page checks remain prerequisites. No claim of human first-use testing, physical-device testing, established long-term fun or educational effect.
