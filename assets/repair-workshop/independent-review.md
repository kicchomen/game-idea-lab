# Independent review — 小さな修理工房

2026-11-05 UTC. Scope: source inspection and independently written Node oracle tests. No browser, physical-phone or human-first-play test was performed by this reviewer.

## Result

Engine and mathematical reachability: PASS. All 13 repair-workshop tests pass, including 5 independently added tests in `tests/repair-workshop-independent.test.cjs`.

Visual layout: pending parent browser verification. Static inspection identifies a short-viewport risk described below; this report does not certify one-screen fit.

## Findings for browser verification

1. At 320×568, the short-height CSS allocates approximately 131px to the bench. After the 28px robot, 7px flex gap, 16px padding and 4px border, the two card rows have less room than their 44px minimum heights plus the 6px gap. CSS grid/flex minimum behavior may overflow the bench toward the message. Check real card bounding boxes, text overlap and pointer targets; reduce decoration or other reserved rows rather than clipping the card controls.
2. The help button is 42×42px while game/action targets are designed for at least 44px. Prefer a 44px target, then verify header fit.

## Independently verified

- An array/set-based minimax partition search, independent of the shipped bit-count helper and supplied solver, considers all 15 unordered faulty pairs and all 41 legal tests. Minimum worst-case adaptive depth is exactly 4.
- Every faulty pair and every legal test returns the exact number of faulty parts, and the supplied input state is not mutated.
- All 225 true-pair/repair-pair combinations distinguish the one correct repair from all wrong repairs.
- An independent adaptive strategy drives actual select toggles, tests and repair actions to success for each of the 15 possible faults within 4 tests. No direct answer assignment is used in that path.
- Ready, lost, won and repaired states ignore ordinary selection/test/repair actions. Fresh jobs change seed and the three-job sequence over 1,000 checked seeds.
- Existing tests cover the four-test budget, free repeated-test rejection, illegal selections, successful next-job clearing, same-job restart and terminal guards.
- Code uses native modal dialog. Help/repair-confirmation can close by Escape; start and result dialogs retain the required progression action. Focus restoration checks whether the prior target is enabled, and next/retry explicitly focus the first part.
- Physical-key repeat suppression covers A–F, Space and Enter. Modifier chords do not change selected parts. Modal state prevents background game actions.

## Difficulty and content

The active test-selection mechanism differs from a fixed-clue deduction game: players choose the observations. Single-part testing of four fixed parts cannot identify all cases. A learned universal adaptive strategy does exist and can be memorized; this is a small finite inference experiment, not evidence of long-term replay depth. Default jobs escalate in optimal test count (1, 3, 4), but this does not establish novice comprehension or enjoyment. Same-job replay intentionally keeps answers unchanged; the UI discloses this.

The design image's 3-test status is not the shipped rule. Shipped code and instructions use 4. If the illustration appears in the article, label it as an earlier design concept or correct it; prefer actual gameplay for rule explanation.

## Limits

Native dialog focus trapping, native key activation, mobile pointer behavior, geometry, zoom, enlarged text, iframe fit and visual legibility require the parent's actual-browser checks. Controller code was inspected, not exercised by a mocked DOM test in this review. No physical-device, screen-reader, cross-browser or human fun claim.
