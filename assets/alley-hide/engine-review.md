# Alley Hide engine / independent logic review — 2026-11-17

## Files and contract
`games/alley-hide/engine.js`: `globalThis.AlleyHide` and CommonJS export `{initial,act,walls,path,limit}`. Immutable state transitions; initial phase normalized modulo 8; status playing/won/lost. Input actions U/D/L/R/listen/search. `clue` and `message` are Japanese strings.

## Corrections driven by verification
1. Initial walls [0,3,6,12,14,15,18] disconnected start22 from the route. Removed wall12. The original specification was unwinnable, not just difficult.
2. Initial route [1,2,7,8,9,8,7,2] with orthogonal-neighbor capture allowed a no-listen fixed sequence U U search U search to beat every phase in 5 actions. Changing only to same-cell capture still gave identical 7-action guarantees with and without listening.
3. Adopted final walls [0,3,6,15], clockwise ring route [7,8,9,14,19,18,17,12], start22, same-cell capture, limit8. A separate belief-set minimax checks only information available to the player. With listen, every hidden phase has a single observation-contingent policy guaranteeing capture within7 turns (6 impossible). Without listen, no policy guarantees capture within8;9 is necessary and sufficient. Thus the prototype now gives listening a demonstrable advantage rather than merely disclaiming the old weakness.

## Exact turn semantics
Move updates protagonist then advances opponent one phase. Listen observes opponent BEFORE it advances; clue includes 1-based turn number and 1-based origin-square number. Search checks SAME cell BEFORE opponent advancement. If successful, wins without advancing opponent. Failed search advances opponent. Then limit8 is checked; success on action8 takes priority. Moving onto/past opponent does not auto-capture. Invalid movement changes only feedback, not position/phase/turn. Walls do not attenuate listening: direction is geometric relative direction in eight compass sectors, not pathfinding direction.

## Tests
`node --test tests/alley-hide.test.cjs`:11 passing,0 failing. Covers normalized setup, unchanged input state, constants, connectivity, all valid/invalid movement inputs, clue origin/age, all9 directions, exhaustive same-cell capture over walkable positions×8phases, moving over opponent, last-turn priority, natural timeout, terminal input ignored, deterministic retry, independent information-set minimax and listening/no-listening comparison. These are engine/logic tests, not actual browser/UI or physical-device tests.

## Actual-engine reference routes
Phase0: U listen search search search search search → win7
Phase1: U listen search search search search → win6
Phase2: U listen search search search → win5
Phase3: U listen search search → win4
Phase4: U listen search → win3
Phase5: U listen search U R R search → win7
Phase6: U listen search R R search search → win7
Phase7: U listen search R R search → win6
The policy chooses branches by observed direction/search failure, not by the hidden phase. Routes above merely make browser regression checks reproducible.

## Remaining limits
The ring is intentionally small and learnable. Listen once then wait/search is part of an optimal policy; repeated fresh observation is not demonstrated as necessary. Do not promise deep ongoing deduction or sustained challenge. UI must explain same-cell search, opponent movement after observation, square-number origin, visible clockwise route and initially unknown phase. Physical phones, novice comprehension, accessibility, browser double-input and iframe layouts still require separate checks. No article or deployment is certified by this report.
