# Pocket Forest — design notes

## Prototype scope

A single 12-placement garden puzzle. The player chooses one of two terrain tiles each turn, then places it on any of the 25 cells. Habitat score and currently living species are recalculated on every placement. No phase transition or delayed scoring: there is a score preview before committing, then the board, score, and residents update immediately.

## Exact rules

Orthogonal neighbors only.

- Fox den: each connected forest group with 3+ tiles is worth 3 points.
- Frog pool: each connected pond group of 1–2 tiles touching at least one flower is worth 2 points. A connected group of 3+ ponds does not host a frog.
- Bee garden: each flower tile touching both a forest and a pond is worth 1 point.
- Owl nest: each connected forest group of 4+ tiles touching at least one pond is worth 3 points.

The score is the value of habitats that exist on the current board. Merging two qualifying forest groups can reduce the fox score by 3 because they become one home. Joining a third tile to a frog's pond group removes that frog habitat and 2 points. The preview names both the score change and any habitat/type that disappears. Species variety is the count of habitat types currently present, not lifetime discoveries.

Win at the end of turn 12 with at least 10 current points and at least 3 currently living species. The result locks further placements; undoing the final move returns to turn 11.

## Offer fairness and retry

Default seed: `MORI-01`. A deterministic integer seed shuffles a 12-offer supply: each of the three distinct two-terrain pairings appears exactly four times, so each terrain appears eight times in the full supply. Retrying the shown seed reproduces the identical offer order and starts with an empty garden. There is no saved state, network access, build step, or external dependency.

## Recorded routes

The Node test suite contains a successful `MORI-01` route with 10 points and all four species, and a losing route that places on 12 non-adjacent cells. Both route inputs are fixed and replayable. See `node tests.js` output.

## Strategy check (small synthetic sample)

The pre-change sample compared immediate score/species greedy and a noisy top-score-first policy across ten fixed seeds. They won 1/10 and 4/10 respectively, so it does not establish a calibrated difficulty curve. It did expose that scoring a pond-flower combination repeatedly could dominate the score even while missing the three-species objective. This build now counts only live habitat value; a third connected pond or forest merge is a previewable loss. The hand-authored winning route shows the default seed is solvable. A focused human playtest should still check whether these losses feel strategic rather than punitive; long-term replay value is not established by this prototype.

## Interaction and accessibility

Mouse/tap: choose a terrain, tap a cell, inspect the preview, then press この場所に置く. Keyboard: 1/2 select, arrow keys move on the board, Enter places, U undoes, R retries. Buttons and grid cells have labels and focus outlines; glyph and Japanese terrain labels supplement color. The board uses five columns with 44px minimum cells and wraps to one column on narrow screens. Rules stay visible throughout play.

## Independent review fixes
The preview result now includes beforeHabitats; its omission crashed the UI forecast. Pointer hover no longer changes the selected cell while moving toward the confirm button. Selection is explicit by click/focus/arrow keys. Node regressions pass; browser verification is recorded separately.

## PDCA after independent review and live standalone checks

Plan: make every placement an intentional choice with a visible habitat tradeoff. Do: implemented a deterministic twelve-offer board with immediate score forecasts. Check: independent review found a missing beforeHabitats preview field, hover changing the selected cell, repeated click/Enter committing consecutive turns, and focus loss after board redraw. Act: restore forecast data, remove hover selection, disarm placement until explicit cell/arrow selection, suppress native Enter repeat, restore focus without rearming, and enlarge/compact narrow controls. Re-check: engine and independent Node regressions pass; parent-operated cloud Chromium passed desktop and320/360/390width checks recorded in browser-qa.json. These checks are not physical-phone or novice-human testing.

After placing or undoing, explicitly select a cell again before the next placement. Keyboard1/2selects terrain, arrows select cells, Enter confirms. Focus restoration alone does not commit or rearm another move.

Final Blogger save/readback, embedded and public-page QA are tracked in publication.json and separate records; standalone checks alone do not establish article publication.

## Article completion

Blogger post3556946122911917495 published2026-10-16T11:44+09:00 (minute precision). Saved HTML exactly matched after reload. Desktop embedded full success and320/360/390px preview operations passed. Public390px title, OG cover, both loaded CDN images, no horizontal overflow and embedded placement were checked. Preview watermark alone overflowed at320px; do not interpret this as a measured full-public320px pass. Details: article-qa.json.
