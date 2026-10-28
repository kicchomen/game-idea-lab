# Independent review — 2026-10-28

## Findings first

No P0/P1 blocking engine or controller defect found in the inspected initial implementation. The following quality limits must remain explicit:

- The three islands are authored fixed layouts. Once memorised, surveying is unnecessary and a shortest route can be replayed. This is a first exploration / information-versus-daylight slice, not demonstrated long-term strategic depth.
- Surveying reveals more terrain but does not automatically produce a better route. Whether a novice notices and values it needs actual human observation. Passing solvability tests is not proof of this experience.
- Clarify the daylight boundary in visible rules: arriving at camp with at least two landmarks at exactly zero daylight succeeds automatically; an earlier arrival requires the finish button. Sent to implementation author.
- The map is a visual `role=img` with only current-position/known-cell-count description, not a fully navigable nonvisual map. Screen-reader play has not been validated and should not be promised.

## Independent checks

`node --test tests/mist-independent.test.cjs`: 14 passed. These are source, pure-engine and minimal mocked-DOM controller tests, not browser painting or physical touch tests.

- Reconstructed adjacency/costs from raw map rows without using production neighbors/moveCost. Independent shortest tour finds a route visiting two landmarks and returning to camp on every island. Added a survey before the route and verified it still fits all three budgets using actual production actions.
- Independent relaxation-distance oracle agrees with known-map return cost on 200 seeded legal walks for each map. Actions leave the original state unchanged; daylight never rises or goes negative; known information is monotonic.
- Every reachable non-camp passable terrain tile has a non-forest exit, so one remaining daylight cannot strand a playing state with no affordable movement in these authored layouts.
- Survey radius checked independently from Manhattan geometry, including corner cells. It reveals terrain without recording landmarks.
- Natural alternating movement to deadline fails, and subsequent finish/survey cannot change terminal state.
- Actual `app.js` evaluated with a minimal DOM substitute: double-click detail and held-key repeat rejected; sub-180ms accidental second input suppressed, later tap progresses; restart confirmation blocks moves, cancellation preserves state, confirmation resets; finish failure, retry, next-island work.
- Entry page has no external asset URLs and states the three-fixed-island scope.

## Structural distinctness

This is not merely a renamed Sensor Shift edit/run trial. The player controls movement, chooses when to buy information, and revises a route as terrain becomes known. Unlike Salvage Diver, cargo does not progressively change return cost; unlike Fossil Museum, no destructive excavation is used; unlike Lost Property, the answer is not a fixed matching assignment assembled from testimony. It still shares finite-resource exploration and fixed authored-content limitations with those experiments. The distinction is sufficient for a new core-mechanic trial, not a claim of a new game genre.

## Artwork review

Opened and inspected `cover.jpg` at 1439×810: an illustrated cartographer with paper map and compass at a tent looks across foggy branching paths toward a stone ruin, forest and coastline. No text corruption, UI claims or extraneous logos. Appropriate as explicitly labelled concept art. It is visually richer than the actual grid prototype and must not be presented as gameplay capture. Actual game screenshot and article copy will be reviewed separately when available.

## Not covered by this review

Real browser painting/scrolling/focus, 256/320/360/390 pixel clipping, physical smartphones, simultaneous touch, other browsers, screen readers, first-time human comprehension and sustained enjoyment. Parent owns live browser and Blogger/publication verification. No remote writes or publication performed by this reviewer.

## Copy and revision recheck — 01:17 UTC

Read `article-copy.md`; the role, two-landmark goal, surveying cost, terrain movement costs, known-route-only return estimate, fixed three-island slice and unimplemented broader map-sharing/weather ideas match code. Suggested replacing ambiguous「島の中で0」with「野営地の外で0」and making quota explicit in the zero-daylight-success sentence. Parent notified. Initial rule-boundary request is now implemented in the visible game instructions. Re-ran all 14 independent checks after current changes: passed. Actual gameplay screenshot and final saved HTML/public rendering are still parent-owned outstanding checks, not inferred from this copy review.

## Actual screenshot and final copy review — 01:40 UTC

Opened and visually inspected `gameplay.jpg` (501×954 actual cloud-browser capture), not a simulated or generated gameplay image. It clearly shows the title, White-Wave island selection, partially explored fog map, current player at the first recorded landmark, remaining daylight18, landmark count1/2, known-path return cost2, four direction controls, survey cost2, disabled camp finish control, retry and other-island controls. The shown state is consistent with initial survey followed by two north moves: daylight22−2−1−1=18 and camp distance2. No clipped map or missing button labels observed in this capture; muted disabled controls correctly differ from enabled controls. Tiny legend/footer text is secondary; primary title, state and action controls remain legible at source size. This image inspection does not independently establish phone-width readability, whose exact-width checks are recorded by the parent.

The final `article-copy.md` now states quota-qualified zero-daylight return success and failure outside camp unambiguously. Core facts match production rules, three authored islands are disclosed, expanded map-sharing/weather ideas remain labelled unimplemented. No blocking content/art mismatch found. Final Blogger HTML, CDN upload, saved-page/readback and public rendering are still outside this independent review; do not infer their completion from this result.
