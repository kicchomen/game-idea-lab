# Implementation handoff

## Files

- `games/waterwheel-week/index.html`
- `games/waterwheel-week/style.css`
- `games/waterwheel-week/engine.js`
- `games/waterwheel-week/app.js`
- `tests/waterwheel-week.test.cjs` (28 engine tests)
- `tests/waterwheel-controller.test.cjs` (20 controller tests, minimal DOM substitute)
- `tests/waterwheel-routes.cjs` (reproducible success/failure routes)
- `assets/waterwheel-week/design-notes.md`

No remote writes, publication, Git push, shared browser operations, dependency installation or settings changes were performed by the implementation worker.

## Engine API

Node: `const E = require('./games/waterwheel-week/engine.js')`.
Browser: `window.WaterwheelEngine`.

`createGame()` returns a fresh state. `select(state, cardId)`, `commit(state, expectedRevision)`, and `nextDay(state, expectedRevision)` return `{ok, state, reason?}`. `retry(state)` returns a fresh state with an incremented revision. `preview(state, cardId)` returns `{ok, resources, buildings, production, cost, gain, remainingDays}` or `{ok:false, reason}` without changing anything. `offers(state)` returns the day's three card definitions. `affordability(state, cardId)`, `capacity(state)`, and `hint(state)` support the UI.

After selection, use the newly returned `state.revision` in commit. After commit, use its new revision in nextDay. Only call nextDay for phase `report`. Phase `ended` is terminal until retry.

## Test command

From repository root: `node --test tests/waterwheel*.test.cjs`.

Source checks: `node --check games/waterwheel-week/engine.js && node --check games/waterwheel-week/app.js`.

## Required remaining browser checks

1. Load actual game at desktop and 320 / 360 / 390 CSS px. Check viewport/client/scroll width and all clickable controls' rectangles.
2. Play success21, failure18 and retry from `tests/waterwheel-routes.cjs`; verify visible results and 7-row history.
3. Check normal tap, click, double click, keyboard Tab/Enter/Space, numeric shortcuts, long-press, unavailable cards and canceled midgame reset.
4. Compare selection preview and actual inventory in at least one example that consumes carried stock.
5. Verify mobile scrolling between cards and preview is understandable. If embedded in Blogger, test actual iframe available width rather than just outer-page width.
6. Check runtime console, failed resources, final-state copy and reduced-motion behavior.

Browser measurements, screenshots and any post-review changes should be documented separately. Do not infer that this handoff's Node tests prove browser QA passed.
