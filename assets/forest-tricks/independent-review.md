# Forest Tricks independent review

Reviewer role: separate implementation-independent agent. Date: 2026-11-15 UTC.

## Tests executed
- Added `tests/forest-tricks-independent.test.cjs` and ran `node --test tests/forest-tricks-independent.test.cjs`: 2/2 passed.
- Enumerated every legal path for seeds 0–99: 5,726 completed hands. Independent rank-based oracle agrees with winner; required follow-suit, card consumption, wins, immutability and result consistency verified.
- Checked every distinct pair of the 14 cards, both possible led suits and both trumps against independent winner oracle.
- Invalid or duplicate play while reveal, terminal next, and state mutation tested. Existing author tests also cover bid validity, unknown cards, same-hand reset and next deal.

## Balance probe (not human playtest)
- For 1,000 seeds, always taking the first legal card yielded win-count histogram 0..5 = [90,262,243,270,121,14]. No constant win prediction guarantees success.
- Simple guess `number of trump cards >=4` plus first-legal play succeeded 339/1000 hands. This is one baseline, not an optimal policy.
- Across seeds 1500–1549 exhaustively, 15 hands have one reachable win total, 30 have two, and 5 have three. Some hands lack meaningful win-total choice. Initial 1511 has 1/2 win routes and supports both success and failure for bid2.
- Fixed deterministic opponent and same-deal replay make memorization possible. Acceptable as explicitly limited one-hand prototype, not evidence of long-term depth. Avoid claiming a sophisticated AI or sustained challenge.

## Rules/code/UI source review
- Two suits, mandatory follow-suit, trump priority, same-suit numeric order, winner leads, five tricks, exact prediction success match the written rules.
- Opponent policy and card strength definition match implementation.
- CSS reviewed: 320px uses five equal card columns, six bid columns, minimum44px button height, no rigid overall width, dialog width constrained. Keyboard1–5 ignores repeats and ignores input during rules/reveal. Actual browser layout and touch behavior must be checked separately by parent; this is not physical-device certification.

## Image review and required follow-up
- Initial cover.jpg clearly shows title, 2-win prediction, five-card hand and both suits with numbers1–7.
- Initial cover duplicates leaf5 and leaf3 between the hand and table. This is impossible for the implemented unique-card deck. Reported to parent for correction before public article. Re-review corrected cover separately; this file does not assert that correction happened.

## Scope
No external write, publication, account change, or browser action performed by this reviewer. No functional engine blocker found. Cover consistency issue pending parent correction; actual browser tests pending parent workflow. No human-first-use, physical phone, screen-reader, or long-term enjoyment claim.

## Cover correction re-review
- Edited via image generation referencing original cover; preserved original file.
- Corrected `cover-fixed.jpg`: JPEG 1200×675, 208680 bytes. Manually inspected full image after final resize/compression.
- Five foreground cards now water7, leaf6, water4, leaf2, water1; center table leaf5 and leaf3. No suit+value duplicates across the seven visible faces. Each numeral in1–7; two suits; title/subtitle and 2-win sign readable. Original layout and theme retained.
- This is a conceptual promotional illustration, not a literal screenshot or single complete gameplay state. Parent should label concept vs actual implementation accordingly.
