# Courtyard Rally: independent source and automated review

Reviewed 2026-11-10. Result: **PASS for the reviewed source and automated scope**, with no blocking issue identified. This is not final browser, deployment, Blogger or physical-device approval. Parent-owned browser QA remains required before article publication.

## Scope and exact evidence

Read the repository README editorial/one-screen policy, recent prototype descriptions, Lantern Ward and Spark Shield design records, preflight record, and the new game's four source files. Opened and visually inspected both `design-concept.jpg` and `court.webp` through an image viewer. No game source was edited. No Git, browser, deployment or Blogger action was performed by this reviewer.

Added `tests/courtyard-rally-independent.test.cjs`: 11 passing independent tests. Reran all three Courtyard Rally suites: **45/45 pass**, comprising 22 author engine, 12 author mocked-controller and 11 independent tests. Command: `node --test tests/courtyard-rally*.test.cjs`.

All independent match outcomes use the production engine from a fresh initial state with ordinary target/direction inputs. No test injects score, ball position, result, opponent position or a winning state. Mock-controller wins also use rendered shuttle/player positions and actual registered keyboard/held-button handlers, without mutating engine state.

Reviewed SHA-256 fingerprints:
- engine.js: `0fc8cad7f60352c5522a4e53f067b61d6ff1ae1a47257810b67f8a7b3a7528a9`
- app.js: `2845ed2f931ce4bd87f999c0c9ce84f08a1907b9ec36b3ea2fb693b3f5dfa5aa`
- index.html: `6eb95585f7b1820e26c14fbf0b6520f77f01350c5243ff88ec866bb8d8015707`
- style.css: `3f5fa1b5bf1e4a43d058b417117c7ae6c3679a5b93696e3f9d453bc7f200e213`

## Structure and challenge

The implemented structure is continuous two-paddle rally play. Move a paddle laterally, intercept the falling shuttle, choose the contact offset that determines its return angle, and score three points before the fixed-policy opponent. A point causes a one-second break and another serve; a match result stops time and offers a clean retry. This differs from recent tower placement, push-your-luck choices, shape matching, sailing navigation and diagnostic deduction. It is a familiar Pong-like structure with a courtyard/battledore theme, not evidence of a novel genre or a faithful simulation of real hanetsuki.

At 60 input samples per simulated second, independent policies produced:
- No operation: 0–3 loss in 5.075 seconds, zero returns.
- Hold left / hold right continuously: each 0–3 loss in 5.075 seconds.
- All **237 integral fixed paddle targets from x=32 through x=268**: every one lost 0–3. This is an integer sweep, not proof about all real-valued coordinates.
- Follow the current visible ball x-coordinate: 3–0 win in 64.500 seconds, 51 total returns.
- Follow using only left/right direction inputs: 3–0 win in 91.892 seconds, 77 total returns.
- Aim toward the opposite far edge from the opponent: 3–0 win in 27.483 seconds, 15 total returns. This policy estimates the incoming landing point and uses the published contact-angle geometry, rather than altering state. It was also sampled at 15/30/144 Hz, with the same result in this particular benchmark.

Thus no-input or a fixed position is not an automatic win, and aiming materially improves this selected benchmark. Nevertheless, quick simple following is enough to win, the opponent/serve are deterministic, and selected return policies can sustain a rally past the author's 300-second experiment cutoff. That cutoff is not an in-game timer. These automated policies establish reachable success/failure and useful contact geometry, not first-time human difficulty, optimal play or long-term depth.

## Physics and time

Independent natural-rally traces checked finite state, legal paddle/ball x-bounds, maximum movement speeds, actual contact-angle calculation, increasing/capped shuttle speed, and point increments only after crossing the goal boundary. Independent reflection arithmetic matched the wall-folding helper for 80,001 sampled x-coordinates from −10,000 to 10,000. The natural idle loss is identical at 30/60/144 Hz and a single long elapsed-time call. Winning and losing terminal states reject later movement/time and further starts.

The controller consumes elapsed time through fixed 1/240-second physics steps without frame-time truncation. Hidden page/blur pauses explicitly and clears inputs. Rendering rewrites several DOM fields every frame, but there are only three moving pieces; no performance issue was demonstrated in these Node checks. Actual browser frame performance, low-end-device performance and long foreground stalls were not profiled.

## Input lifecycle and reset

Independent mocked-controller runs completed full 3-point victories using keyboard-only and held-button-only following; both returned to clean ready states and restarted with no inherited motion. Separate tests covered:
- Natural no-input failure and retry without fabricated terminal state.
- Drag coordinates with a nonzero left offset, 5px border and 270px content width.
- Ignoring an unrelated pointer; global pointer release clearing a drag.
- Help/native dismissal remaining explicitly paused.
- Clearing simultaneous keyboard aliases and drag targets through interruption.
- No queued frames or resumed motion after terminal retry and stale releases.

Author tests additionally cover multiple pointers, independent key aliases, opposite direction cancellation, repeated pause/start keys, capture loss, pointer cancellation/leave, hidden-page/blur interruption and pause-menu restart. These are mocked event tests, not browser touch, native keyboard-default-action or physical-device tests.

## Responsive geometry, accessibility and images

Source has a fixed-height grid, container-sized court with preserved 300:340 aspect, an alternate landscape layout, viewport-contained scrollable help, and nominal 44px minimum button targets. At the specified narrow widths, this is a sensible one-screen design. However, CSS/source review cannot prove actual text wrapping, focus scrolling or unobscured controls. Parent must operate ready/play/success/failure/retry at 320/360/390 CSS px, recording heights for standalone and saved article embeds; short-height and landscape checks are especially relevant. Arbitrarily short viewports are not established as supported.

Native buttons, visible keyboard focus, keyboard movement, textual score/phase and labeled help are present. Full screen-reader play is not established: moving positions are visual. Initial review also identified redundant every-frame live-phase writes; the follow-up below confirms that this was fixed. Avoid an unqualified accessibility claim. Reduced-motion CSS does not eliminate essential shuttle motion. No physical mobile, screen reader, cross-browser, novice-human or long-term enjoyment testing was performed here.

The generated concept clearly communicates the warm paper palette, teal player/red opponent, score, central court and lower controls. It is an illustration rather than an implemented-screen capture. The court asset is consistent with that concept and leaves substantial visual space for play. The asset contains a painted border/center line. Follow-up source inspection confirms a 120% × 114% crop, an edge-aligned CSS frame and hidden duplicate CSS center line; parent should still visually verify that the resulting court communicates collision boundaries clearly. Neither asset itself proves playable geometry or final UI fidelity.

## Remaining publication gates

Independent code review is complete. Parent should retain exact source/deployment matching, real browser interaction and responsive evidence, saved article readback, ordinary Blogger CDN image verification and final publication verification as separate gates. Any material game-source change after the fingerprints above needs affected tests/review repeated. No human, physical-device or publication result should be inferred from this PASS.


## Follow-up: text-update correction and article review

Reviewed later on 2026-11-10. **PASS for revised source and draft editorial scope**, with the publication gates below still open. No code changes were made by this reviewer.

The updated `app.js` introduces a shared text setter that changes `textContent` only when its value differs. Score, live phase, feedback, pause and overlay text use it. The added author regression counts text writes over ten unchanged animation frames and verifies a pause still updates the status. I independently reran `node --test tests/courtyard-rally*.test.cjs`: **46/46 pass**, now 22 engine + 13 author mocked-controller + 11 independent tests. This resolves the redundant live-region-update issue, but does not establish complete screen-reader play. The full-repository 1,074-test result was reported by the parent/builder; this follow-up independently reran the 46 game-specific tests only.

Revised app.js SHA-256: `da1d3f06144e3804a6a8899615a3781a6c7b20c7fc95af048e25a82939e79ca9`. Engine, HTML and CSS fingerprints match those listed above. The CSS end overrides were explicitly reread: background crop `120% 114%`, court lines at inset zero, and duplicate CSS dashed center line hidden. This clarifies and resolves the source-level duplicate-line concern in the initial review, subject to parent-owned actual rendering inspection.

Read the completed design notes and image provenance alongside the implementation. The notes distinguish automated policy comparisons from human ability and state that the 300-second observation cutoff is not a game deadline.

### Article draft

Reviewed `article-draft.html`, 2,718 bytes and approximately 605 visible non-whitespace characters, SHA-256 `eac3cac20a9d60f0d136b74ec7ddf5d6855bdbafadef187857e7d538df68a22f`. The draft is concise and image-led. Its controls, automatic return on contact, three-point win, wall reflection, increasing speed, one court and one opponent agree with the implementation. Contact location changes angle as described. The opening illustration and planned actual-play screenshot are explicitly distinguished. The explanation that image generation preceded implementation and the generated background is combined with moving game objects agrees with the design/provenance record.

The article does not claim established fun, human win rates or mandatory strategic aiming. It states that fast following alone can win, rallies can run long, and physical-phone/first-time-human/long-term enjoyment remain unverified. Front/back movement, unusual opponent returns and doubles are framed as future ideas rather than playable features. No mandatory editorial rewrite identified.

Two conditions remain before this draft can be published:
1. Replace `COVER_CDN` and `GAMEPLAY_CDN` with verified normal Blogger CDN images, and use an actual screenshot for the image labeled as an actual trial screen. That screenshot was not yet present at this review.
2. The past-tense statement that success, failure and retry were checked in a real browser is conditional on completing and recording those actual checks. Parent explicitly confirmed that publication is withheld until that gate passes. Mocked-controller evidence alone cannot satisfy it.

The iframe has a descriptive title, width 100%, 640px height and a separate HTTPS play link. This source structure is reasonable but still requires the saved Blogger article's real narrow-width/height checks.

### Cover visual inspection

Opened `cover.jpg` using the image viewer, rather than inferring its contents from the filename. The title reads 「庭先の羽根ラリー」 and the subtitle reads 「当てる位置で、返す向きを変える」. Both are legible and match the game. The dotted return arrow is a straight diagonal pointing toward the opponent's side, consistent with linear travel between contacts/wall reflections. Teal bottom paddle, red upper paddle, white shuttle and warm courtyard palette match the prototype. The scenic perspective is acceptable for the explicitly labeled concept illustration and should not be treated as a screenshot or exact collision diagram.
