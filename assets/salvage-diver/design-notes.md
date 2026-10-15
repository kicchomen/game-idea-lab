# 深海サルベージ — design notes

## Experience and selection

You are the diver who has to bring the treasure back, not merely find it. A small valuable object makes the next move more expensive; the temptation is to take one more thing while a safe route home still exists. All values, paths, weights and costs are visible. There is no timer, hidden random death roll, route editor or autoplay.

The immediate five-to-ten-second beat is selecting a lit neighboring site, recovering the pearl, and seeing movement oxygen rise from 2 to 3. Ten-minute depth is comparing a deep single-object trip against several shallow pickups, banking early, and recognizing when to discard cargo to make it home. A proposed hour-scale game would add connected wrecks, recoverable expedition objectives, crew specialties, equipment and persistent ship restoration. Those are concept scope, not features of this prototype.

Compared directions before implementation: a ship-repair action game would overlap recent continuous maintenance; a salvage routing edit-and-replay game would repeat earlier setup puzzles. Direct, turn-based exploration with bankable cargo introduces voluntary risk and a concrete retreat decision.

## Comparison to all earlier experiments

| Earlier game | Main structural difference |
| --- | --- |
| Sensor Shift | Angle edit then simulation, versus direct room-by-room choices with irreversible pickup and banking |
| Footstep Echo | Past-position coordination, versus variable carrying costs and deciding whether to retreat |
| Tiny Tug | Continuous steering and spatial convoy hazards, versus discrete oxygen accounting and voluntary cargo risk |
| Night Market | Inventory/sales allocation, versus traversing a graph with cargo that changes the cost of returning |
| Fire tactics | Turn-based tactical rescue/fire response, versus optional treasure retrieval and a safe deposit point |
| Hush Courier | Timed stealth and delivery, versus no reflex requirement and an explicitly visible resource budget |
| Sky Plates | Real-time maintenance priorities, versus bounded self-paced expeditions |
| Fossil Museum | Excavation information and correct tool use, versus fully visible routes and value/weight tradeoffs |
| Spark Shield | Enemy telegraphs and combat resource windows, versus a player-selected retreat without an opponent |
| Lost Property | Deductive matching of claims and evidence, versus known information and economic route choices |
| Windbird | Continuous flying, thermals and stamina recovery, versus weight-sensitive turn costs and banked gains |

The distinctive loop is move → recover → reassess loaded return cost → bank or risk more. Retry starts the selected expedition fresh; there is deliberately no undo, so the voluntary commitment remains meaningful. Invalid/nonadjacent/repeated impossible actions do not spend oxygen.

## Implemented scope and rules

Three selectable fixed expeditions, six nodes and seven bidirectional connections each. They share topology and vary treasure values, weights, tank size and required bank value. This is an intentionally small route-economy experiment, not three large new maps. All three can be completed in two dives, leaving one spare for learning. The third expedition now requires deep-vault retrieval: its 38-point quota exceeds the 33 points available outside the vault. The first two seas’ conservative route no longer wins the third. Difficulty remains unvalidated with novice human players.

- Three tanks/dives maximum per expedition, each with 22 / 24 / 26 oxygen.
- Targets: 14 / 22 / 38 banked value.
- Move oxygen: 2 + ceil(carried weight / 3). Capacity 6.
- Collect oxygen: 2. Items cannot be collected twice.
- Shortest return cost is computed from the actual graph and current load, not scripted.
- Before a pickup, the UI also shows remaining oxygen and shortest return requirement with the projected load.
- Reaching surface banks all cargo. Unbanked cargo never counts toward victory.
- Exact-zero surface return is allowed; zero oxygen underwater ends the expedition with rescue. Already banked value remains visible.
- Discard all cargo for no oxygen cost, permanently losing those items; subsequent movement is lighter. This cannot restore exhausted oxygen.
- Third return below quota, or oxygen exhaustion, ends the expedition. Retry resets bank, treasure, tanks and position. Next expedition unlocks as a convenience on victory; selection is available from the outset.

No network requests, imports, build step, external dependencies, analytics, authentication, persistent storage, audio or real-time loop. DOM controls and inline SVG paths; static files also work on an ordinary server. The actual engine is shared by browser and Node.

## Controls and responsive intent

Tap/click an adjacent map location, or Tab and Enter. Location shortcuts: 0 mother ship, 1 coral shelf, 2 wreck, 3 stone gate, 4 seabed garden, 5 deep vault. Space outside a native button/summary performs the primary action; on a focused button it retains standard browser activation. R retries. Repeated keydown is suppressed, including native Enter/Space repeat. Buttons are at least 44px high; room buttons are at least 56px. Layout is designed for 320px document width and narrower article content; actual browser measurements must be recorded separately.

## PDCA and verification

Plan: test whether carrying treasure makes the retreat decision tangible rather than only giving a score.
Do: implemented a visible six-node graph, three-dive limit, all-or-nothing cargo banking, load-dependent movement and permanent discard.
Check: deterministic production-engine routes complete all three expeditions; deep-vault-only trips return safely in each. Tests also cover exact-capacity pickup, overload rejection, exact-zero return, overspend return failure, underwater zero, three empty dives, final-dive victory, immutable state, repeat inputs and terminal-state handling. Initial presentation exposed only the current return cost, requiring mental arithmetic for a pickup's weight increase.
Act: added a prospective pickup line with post-pickup oxygen and loaded return cost, including an explicit warning when loaded return is impossible. Rescue failure now moves the position marker to the mother ship, matching the narrative. Added controller regressions for forecast and keyboard/native-button behavior.
Re-check: `node --test tests/salvage*.test.cjs` passes 31 tests (25 engine, 6 mocked-controller). Mocked DOM tests are not browser or physical touchscreen evidence. Browser QA, publication, independent review and player-comprehension testing are not claimed here. No claim of proven long-term fun.

Next human playtest questions: Does a player notice the post-pickup return warning? Do they perceive banking as a satisfying voluntary decision? Do they use a deep-item route or only the conservative shallow sweep? If the latter dominates, the next design pass should change routes/objectives rather than merely increase numeric quotas.

## Reproducible live-browser routes

Winning route for the first two expeditions (visible controls):

1. 潜水する → 珊瑚棚 → 回収する → 石の門 → 回収する → 珊瑚棚 → 母船
2. 潜水する → 沈没艇 → 回収する → 海底庭園 → 回収する → 沈没艇 → 母船

Bank totals are 21 / 27, respectively; each uses two dives. For expedition 3: dive → A → C → collect → A → D → collect → A → S (22 bank, 4 oxygen), then dive → A → C → E → collect → C → A → S (40 bank, 6 oxygen). Press 次の海へ after the first two wins. After final victory, やり直す returns to expedition 3's initial state.

Failure route without timing: 潜水する → 珊瑚棚 → 母船, repeat for three empty dives. Failure then retry should restore 0 / 3 dives and 0 bank.

Oxygen failure route: 潜水する → 珊瑚棚 → 石の門, then alternate 珊瑚棚 and 石の門 until oxygen reaches zero (11 total moves from the surface). Retry restores all treasure.

Deep-vault safe route: 潜水する → 珊瑚棚 → 石の門 → 深海金庫 → 回収する → 海底庭園 → 沈没艇 → 母船. This banks 12 / 14 / 18 with remaining air 2 / 4 / 6, demonstrating a different viable route.
