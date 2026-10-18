# ろくろの小さな工房 / Pottery Workshop

## Experience first

The player is a potter making a specific vessel for a person. Touch a height on the clay, move its wall, and immediately see the continuous silhouette change. The fantasy is attentive craft: a local touch affects the neighboring form, so correcting the mouth can disturb a shoulder that already looked right. The customer requests ground the three shapes in an intended use.

Candidates considered: freehand clay craft, a thread-weaving craft puzzle, and a cafe order service game. Cafe service would overlap recent dispatch and maintenance priorities. Thread weaving would risk becoming another route/constraint puzzle. Clay shaping adds direct, self-paced manipulation of a continuous-looking object. It is not an angle edit followed by a simulation or a preset result animation: the playable clay is the authoritative seven-band state, drawn and evaluated after every hand movement.

The first 5–10 seconds aim for an immediate side-drag and a visibly wider or narrower wall, including nearby heights. A ten-minute hypothesis is learning to spread work between adjacent heights, stop once the requested tolerance is reached, and avoid wasting effort on unnecessary corrections. An hour-scale concept could add asymmetric forms, clay bodies, attachments, surface decoration, glaze trials, a display shelf and recurring customer commissions. Those possibilities are not implemented or evidence of long-term fun. The current work is a small shaping trial, not a full creative pottery simulation or shop game.

## Structural comparison with prior experiments

| Prior experience | Main verb, object and feedback | Difference here |
| --- | --- | --- |
| Sensor Shift | Adjust a detector, play simulation, inspect route | Directly reshape the final object; feedback is immediate, with no run phase |
| Footstep Echo | Move on a grid and coordinate with a delayed position | No traversal or delayed echo; neighboring form changes are simultaneous |
| Tiny Tug | Steer a convoy through hazards in real time | Stationary object manipulation, no navigation or clock |
| Night Market | Allocate scarce stock across uncertain demands | Visible fixed silhouette, spatial coupling rather than inventory uncertainty |
| Firebreak Keeper | Move crews and spend turn actions before spread | No opponent/environment turns; player determines the entire pace |
| Hush Courier | Move, hide and time deliveries against a cycle | No stealth window, timed delivery or movement through a level |
| Sky Plates | Move between and maintain decaying targets | No passive decay; effort is spent only on an intentional deformation |
| Fossil Museum | Reveal hidden specimens with tools and information | The entire target is visible; success depends on construction, not discovery |
| Spark Shield | Respond to combat telegraphs with resource actions | No adversary or exchange of attacks; craft changes remain visible |
| Lost Property | Infer matches from testimony and inspection | No concealed identity/evidence; match the physical contour by making it |
| Windbird | Steer, flap and rest to traverse a course | No continuous time or inertia; a stroke acts on material, not a moving avatar |
| Salvage Diver | Retrieve cargo and reassess the return cost | Effort is consumed locally while forming an object; no route, banking or retreat |
| Pocket Forest | Place terrain and inspect habitat relationships | Continuous-valued widths replace discrete placement and adjacency scoring |
| Rail Dispatch | Commit independent moving trains through a shared junction | Self-paced manipulation of one persistent object rather than traffic timing |

Retry always returns the current order to its original cylinder and full effort. Switching order also starts it afresh. There is no saved progression or undo. Broader creative and economic progression is deliberately outside the trial.

## Exact implemented rules

- Seven editable height bands, numbered from mouth (1) to foot (7). Values are half-widths in the drawing, not real units or physical measurements.
- Initial profile, top to bottom: `[52,52,52,52,52,52,48]`.
- One narrowing/widening stroke changes the selected width by −4/+4, adjacent bands by −2/+2, and the next bands by −1/+1. More distant bands do not move. Widths clamp to 24–88.
- A stroke consumes one effort only if at least one width actually changes. Selecting a height and dragging vertically are free. Reversing a stroke can restore the shape, but still spends another effort.
- Order 1, 朝のお茶碗: target `[60,64,68,70,70,62,48]`; 14 effort.
- Order 2, 一輪の花びん: target `[39,35,43,62,74,68,50]`; 18 effort.
- Order 3, ひらく菓子鉢: target `[80,76,68,59,50,43,38]`; 16 effort.
- A band matches when its absolute error is at most 4, inclusive. All seven must match. The “合った帯” counter and green indicator dots use the same exact engine measurement as the kiln.
- Firing is an immediate, irreversible evaluation of the current shape. All seven matching wins; otherwise it fails. This is an abstract handoff/evaluation, not an implemented firing simulation. The success render uses a decorative green finish; players do not choose glaze.
- Effort at zero locks further shaping but leaves firing available. A matching final stroke can still succeed. There is no idle timeout or hidden random breakage.
- Success and failure lock shaping, height changes and duplicate firing. Retry and order selection remain available. Success on the first two orders offers the next order; the last order describes the trial limit.
- Pure deterministic immutable transition functions in `games/pottery-workshop/engine.js` are used by both browser and Node tests. No dependencies, imports, build, account, storage, analytics, audio or gameplay network requests.

## Interaction, view and accessibility intent

DOM holds text, order selection, effort, height selection, shaping buttons, kiln, retry and result. Canvas 2D renders the actual seven profile points with smooth interpolated sides, clay rings, wheel, a mint dashed target and numbered height markers. The result still shows the produced object. Canvas graphics do not own game state.

Pointer: press on the canvas to choose the nearest height, then drag horizontally. Outward on either side widens; inward narrows. Every 12 logical pixels accumulated horizontally applies one stroke. Vertical movement into a new height selects it and clears the partial horizontal stroke. Pointer capture supports a continued drag; release, cancel, lost capture, window blur and hidden-page interruption clear the gesture. An additional pointer cannot hijack the active one. There is no wall-clock state to pause.

Alternative controls: a native height select and two shaping buttons provide identical engine actions. On the canvas/page, 1–7 select a height, ↑/↓ change height and ←/→ narrow/widen. Native buttons/selects preserve their own keyboard behavior. Repeated keydown, including Enter/Space repeat on buttons, is suppressed. Buttons and select are at least 44px high. Layout is intended for 320/360/390px and narrower iframe content; actual measurements belong in the browser evidence, not this source-level assertion.

A polite live feedback region announces a completed stroke and remaining effort, readiness, or win/loss with match count. Screen-reader text also lists all current and requested widths. This is accessibility support, not a claim of screen-reader usability testing. Physical-phone touch, first-time-human comprehension and cross-browser behavior remain unverified here.

## Challenge and limits

There is a concrete cost to overcorrection: a local change can move neighboring bands out of tolerance, and reversing it consumes another effort. The three silhouettes require different patterns, particularly the vase’s constricted neck beside a broad lower body. The target is fully visible and the tolerance is intentionally generous. There is no hidden recipe or target-specific success override.

Input-only production-engine routes found in the tests complete the three orders in 7, 13 and 11 strokes, leaving 7, 5 and 5 effort. These are feasible routes, not shortest-path claims. Independent review reported still shorter advanced-order routes. The trial does not establish a calibrated difficulty curve, sustained replay motivation or satisfying creative freedom. A direct per-band “fix it” strategy is fairly strong; the coupled corrections and effort budget need novice-human evaluation before a larger game is justified.

## PDCA — 2026-10-18

Plan: test whether directly shaping neighboring heights produces a different handcraft experience from route editors, resource return games and live dispatch.

Do: implement three clearly different profiles, a symmetric five-band influence kernel, finite effort, a live target overlay, desktop/touch alternatives and deterministic kiln evaluation.

Check: production-engine input searches found all three solvable. Early generous budgets left 11–13 spare actions, so the limited effort had little bite. Code review also found that a closed-curve interpolation could overshoot across the mouth/base joins, that an 8-logical-pixel drag threshold could spend effort too quickly on narrow screens, and that generic terminal retry text was insufficient as the only live announcement. The phrase “ぴったり” overstated the ±4 matching tolerance.

Act: set effort to 14/18/16; interpolate each side separately; increase the drag step to 12 logical pixels; tell players to drag in small increments; announce per-stroke effort and actual terminal outcome; use “注文の形に合いました.” Keep “one stroke affects neighbors” visible and retain the exact equivalent button controls.

Re-check: `node --test tests/pottery*.test.cjs` passes 31 checks: 20 production-engine tests and 11 mocked-DOM/controller tests. Coverage includes all-order input-only wins, meaningful neighbor disturbance, immutable transitions, clamps, invalid actions, tolerance boundaries, budget exhaustion, final-stroke success, deterministic replay, terminal locks, retry, actual DOM command wiring, keyboard/native-control handling, both drag directions, free vertical selection, pointer cleanup and multitouch isolation. Mocked DOM tests are not visual browser evidence. An attempted isolated Chromium launch in this build container was blocked by its socket permission; Pages/cloud-browser verification is tracked by the publishing task separately.

Next human playtest questions: Can a new player predict why a neighboring shoulder changes? Does the drag step feel controllable on a real phone? Do they notice when all seven bands already match, or waste effort chasing exact overlap? Does limited effort add care or merely punish exploration? If the latter, compare an unlimited practice mode against explicit commission budgets before adding more shapes.

## Reproduce and browser routes

Serve the repository root and open `/games/pottery-workshop/`. Run `node --test tests/pottery*.test.cjs` for focused checks. No start button is required; clay is immediately editable.

Winning route, order 1, using native select + visible buttons:
1. Select height 4; widen twice.
2. Select height 3; widen twice.
3. Select height 5; widen twice.
4. Select height 2; widen once.
5. Confirm the counter is 7 / 7 and remaining effort is 7. Press 窯で焼いて渡す.

Winning route, order 2, one stroke per entry (numbers are displayed 1-based heights; + is widen, − is narrow): `5+,5+,2−,2−,5+,6+,2−,5+,1−,1−,2−,4+,3−`. Fire with 7 / 7, remaining 5.

Winning route, order 3: `2+,2+,1+,1+,1+,2+,7−,1+,7−,2+,7−`. Fire with 7 / 7, remaining 5.

Failure: immediately fire fresh clay. Result must say the request is not yet matched; shaping locks. Retry must restore the current order’s budget, initial profile and selected height 4. Effort failure route: alternate widen/narrow fourteen times on order 1, observe disabled shaping and enabled kiln, then fire. This returns to the initial profile with no effort and fails.

Pointer check: with order 1 fresh, touch/drag the right side at band 4 outward by 24 logical pixels; observe two effort consumed and the center width increase by 8. On the left, a 12-logical-pixel outward drag must widen by 4. Logical-to-CSS distance is `canvas CSS width / 360`. Release, move again, and confirm no further effort is spent. Parent browser checks should exercise ordinary user input, not assign a victory state.

## Source files

- `games/pottery-workshop/index.html`: semantic DOM and static rules
- `games/pottery-workshop/style.css`: responsive paper/clay presentation
- `games/pottery-workshop/engine.js`: shared pure rules
- `games/pottery-workshop/app.js`: input mapping, announcements and canvas rendering
- `tests/pottery-workshop.test.cjs`: engine regression suite
- `tests/pottery-controller.test.cjs`: mocked-DOM interaction suite

Original concept art, article and publication/browser records are supplied by the separate publishing work. Illustrations are not screenshots or evidence that proposed full-game features exist.
