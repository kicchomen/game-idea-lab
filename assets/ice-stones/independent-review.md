# Independent source / simulation / artwork review — 2026-10-26

Reviewer operated separately from implementation and publishing agents. This record is not a browser playtest, physical-phone test, screen-reader test, or novice-human evaluation.

## Scope and concept
Read the current repository README planning constraints and existing game inventory, then all four newly implemented files (engine.js, app.js, index.html, style.css). The experience is committing finite shots to a persistent physics layout. Stones remain between shots and collisions move both colors; a later shot may improve or spoil an earlier placement. This differs structurally from Sensor Shift's one-angle reset/replay, Tiny Tug's continuous convoy steering, and the recent packing/production/negotiation games. It is still a small fixed-layout game and does not establish originality across the whole genre.

The three current challenges admit repeating one angle/power for all three shots, with different directions per challenge. Therefore do not claim that this trial proves strategic depth or sustained enjoyment. The third configuration's early shots can move the orange center stone before the final shot obtains a winning position; persistence is real, rather than a cosmetic sequence of independent throws. Future opponent response / variable ice / tournament systems must remain labeled unimplemented.

## Independently exercised production engine
`node --test tests/ice-stones-independent.test.cjs`: 8 tests pass.

- All three rounds succeed using ordinary exposed settings: 0°, −10°, +10° respectively, power65, three throws each.
- Three default power50 throws and minimum power20 throws fail on every round.
- Exact final stone coordinates agree at 30/60/120/144Hz frame cadences.
- All 561 single-shot combinations (3 rounds × 11 direction settings × 17 power settings) settle with finite positions inside the rink.
- Paused states remain unchanged under timestep and launch attempts; resuming is explicit.
- Invalid parameters do not mutate state; post-result update/launch/pause/resume are rejected.
- Collisions actually move orange stones, and previous positions persist when a new shot is launched.

Additional deterministic random simulation (seed17, LCG1664525/1013904223): 3,000 rounds / 9,000 throws, all settled, no nonfinite or out-of-rink final positions, maximum255 frames at60Hz per throw. This explores simulated state, not human difficulty. It does not prove physical realism or rule equivalence to curling.

At first combined run, implementation20 + independent8 tests =28 passing,0 failing. Subsequent controller test totals are owned by the implementation/publishing record.

## Findings and corrections
1. The first judge used a0.5 distance margin, while prose promised simply closer. Implementer changed it to strict blue distance < orange distance; equality is not success. Rechecked passing tests after correction.
2. Initial failure text said the blue stone did not reach, even when it could be in the ring but farther than orange. Implementer changed to a neutral '今回は青の勝ちにならず'.
3. Per-frame reassignment of the polite live status can cause unnecessary announcements. Implementer added assignment only when the message changes; final source re-read confirms the guard. Actual screen-reader behavior remains untested.

Static UI review: semantic native buttons; explicit labels; keyboard direction adjustment and ordinary Enter/Space activation; blue●/orange× symbols supplement color. Fieldset disables shot adjustment during motion; paused/result controls cannot add shots; reset creates clean state. Hidden/blur interruption pauses. CSS button min-height44px and narrow-width media rule are present, but only real-browser checks can establish actual geometry, canvas legibility, scroll behavior and control success at320/360/390px.

## Artwork
Visually inspected `baseline/assets/ice-stones/cover.jpg`: landscape illustrated winter pond, blue and orange flat stones, target ring and visible collision. Japanese title '氷上の寄せ石', subtitle '寄せる？ 弾く？', and explicit 'ゲームの構想イラスト' label are correct and readable. It is not an actual gameplay screenshot. No brooms/handles/opponent turn AI are implied. Article should pair it with a genuine trial screenshot and distinguish the aspirational scene from implemented UI.

## Publication gate
No source/simulation blocker found after judge/failure-copy corrections. Live-status correction is verified in source, and actual browser success/failure/retry/repeated-input/responsive testing plus article/CDN/deployment verification are still required by the parent. No browser or publication approval is implied by this source review.

## Final source re-review

At01:12UTC the live-region message guard and explicit equal-distance rule were re-read. All36 tests pass (20 implementation engine +8 implementation mocked-DOM controller +8 independent engine). Controller test source was also reviewed: all3 challenge flow, input locking, failure/retry, key-repeat, blur/hidden pause, range and P shortcut, reset during motion. These mocks do not substitute for browser rendering/input evidence. SHA256 manifest refreshed after these corrections.
