# Independent review — 2026-10-31

Reviewer: separate delegated agent, not implementation author. Baseline repository main: `3114bba9a046938714162cfd2c3712f2e2d2b43f`. Reviewed uncommitted `games/tide-crabs/{engine.js,app.js,index.html,style.css}`, repository selection policy and prior Cloud Post design notes.

## Findings

1. **Correct before publication — rules text contradicts score cycle.** Initial HTML described `1→3→2→1`, but production `values` yields `1→2→3→1` at each rock. Reported to author immediately. Author corrected the HTML to `1→2→3→1`; reviewer re-read it and re-ran all 9 independent tests at 01:02 UTC. Resolved.
2. **Scope/challenge limit, not a correctness defect.** A legal route reaches blue positions 12/17 and wins 23–15 after passing the last four rounds. The fixed one-round-greedy opponent does not reclaim those rocks. Repetition is therefore vulnerable to memorization and passive holding, not evidence of sustained strategic depth. Disclose fixed board/rival and untested long-term fun; future variation, opponent policy and map design are concepts, not delivered features.

No additional engine correctness defect found in the independent checks below. Source review alone does not certify visual or actual-browser behavior.

## Independently authored checks

`node --test tests/tide-crabs-independent.test.cjs`: **9 tests pass** at review time.

- Independent coordinate legality oracle across 500 distinct four-piece arrangements, checking 162 move candidates per arrangement (including out-of-range input).
- Friendly blocking, one-opponent push, blocked push, chain push rejection, edge/wrap rejection.
- Eight-round scoring cycle, point conservation bound, deterministic winning route, natural idle defeat.
- 400 complete seeded random action runs: immutable input, unique in-bounds occupancy, valid action budgets, monotonic scores, at most six points per round, and terminal outcome agreement.
- No-op terminal inputs and fresh-state isolation.
- Mock DOM controller: actual production handler path for victory, defeat, retry, held-key repetition suppression, crab selection, cancelled and confirmed midgame restart.

The mock DOM is not a browser, physical phone or first-time human test. Parent owns actual browser, embed, visual, responsive 320/360/390 px, Blogger CDN/readback/publication and remote deployment checks. This review does not claim these passed.

## Design comparison

The primary verb is positional move/push, feedback is opponent displacement plus per-round occupation score, and victory is relative territory score after eight rounds. This differs from the preceding deck-composition loop, continuous cooking timing and fog-route exploration. It also differs from Shell Auction's bidding and final collection scoring; adversarial control of a shared spatial board is the implemented distinction. It is a core experiment in an established territory-control genre, not a claim to invent the genre.

## Independent delivery-content review — 01:12 UTC

Read final `article.html`, `design-notes.md`, `browser-qa.md`; visually opened actual `cover.jpg` and `gameplay.jpg` pixels with view_image.

**Content/art review passes; no mandatory copy/image fix found.**

- Cover is wide 1439×810, visibly two blue and two orange illustrated crabs, three shell-topped rocks, a nudge/territory scene; no false screenshot UI or unreadable generated labels. Article explicitly labels it generated concept illustration, different from actual play.
- Actual screenshot shows blue 1 at row 4 column 1, blue 2 at bottom-right, orange at the top corners, three central 1/2/3 point rocks, and one action left. This matches the article alt text and one legal initial move. The screenshot is not presented as a richer rendered game than implemented.
- Article accurately describes two actions shared between crabs, legal one-square push only with clear space behind, opponent acting before scoring, eight rounds, no timer and retry. Player input is accurately distinguished from current score computation.
- Core experiment vs future board variety/multiplayer is clearly separated. Fixed-policy/memorization and passive late-game holding are disclosed; physical phone, novice-human and long-term fun remain unverified.
- Browser QA text explicitly labels 320/360/390 px as desktop iframe-width emulation, not real smartphones. The article does not claim physical-phone verification.
- Wide image first, concise concept description, actual gameplay image, standalone link, titled embedded prototype and short controls satisfy the requested image-led structure.

The actual saved Blogger wrapper, public page/CDN fetch and embed layout must still be verified by the publishing owner. The iframe has a 1px border alongside width:100%; check the final theme's box-sizing/overflow rather than infer fit from this HTML review. This is a check reminder, not a reproduced defect.
