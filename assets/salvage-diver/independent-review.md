# Salvage Diver independent review — 2026-10-15

## Scope and result
Reviewed the shared production engine, DOM controller, CSS, HTML, README conventions and design notes. Added 14 independent production-engine tests in `tests/salvage-independent.test.cjs`. All three expeditions are solvable through ordinary actions. No game state injection is used by these route tests.

Parent-authorized repair: raised expedition 3's quota from 30 to 38. At 30 the identical shallow two-dive strategy won every sea, giving little reason to change strategy. At 38, all non-vault treasures total only 33, so the player must visit the deep vault and rethink grouping. Updated builder tests, independent tests, optional browser runner and design notes consistently. Source is frozen after this repair.

## Exact routes
Notation: S mother ship; A coral shelf; B sunken boat; C stone gate; D seabed garden; E deep vault. “Collect” is a separate action costing 2 oxygen. Every line begins by pressing Dive.

- Seas 1 and 2: S → A collect → C collect → A → S; then S → B collect → D collect → B → S. Bank totals 21 and 27; two dives.
- Sea 3: S → A → C collect → A → D collect → A → S (bank22, oxygen4). Then S → A → C → E collect → C → A → S (bank40, oxygen6), two dives. The old route banks33 and correctly remains unfinished.
- Conservative three-dive alternative on all seas: C alone, D alone, E alone, each via shortest return. Sea3 banks40 in three dives.
- High-risk one-dive route for seas1/2: S → A → C → E collect → D collect → A → S. Banks18/22 with oxygen0/2. Exact-zero surface arrival succeeds.
- Natural oxygen failure, sea1: S → A → C → E collect → C → A → D → B. Oxygen exhausts on B; no return or score injection.
- Quota failure: three empty dives S → A → S. Retry must reset bank, all treasure, oxygen and dive count.
- Real discard rescue, sea2: S → A → C → E collect → D collect → E; discard; C → A → S. Return succeeds with zero oxygen and zero bank. The discarded treasures remain gone.

## Exhaustive and regression findings
Exhaustively enumerated single-dive move/collect states, deduplicating room, oxygen, remaining item IDs and cargo IDs. Highest one-dive bank is18/22/27 respectively. These numbers apply to no-discard routes; discarding cannot improve a maximum-bank route with five fixed one-shot treasures. Third sea requires at least two dives. Tests cover all maxima, ordinary return strategies, delayed banking, exact-zero gamble, natural extra-detour failure, actual discard rescue, retry and mandatory deep retrieval.

## Remaining design limits
- Shared six-node topology, not three structurally different maps; label them expeditions/numerical variations.
- Three dives and a deterministic visible return estimate make this an approachable resource-routing puzzle. The changed third target creates a necessary choice, but sustained difficulty/fun is not proven.
- No real-time hazards or random outcomes. Once a route is learned, replay is deterministic.
- Drop irreversibly removes all carried treasure, as the instructions state. It is a valid emergency decision rather than undo.
- Main success/failure controls are native buttons, repeated keydown is suppressed, and no analytics/storage/network gameplay dependencies were found.

## Browser verification boundary
Prepared `tests/salvage-independent-browser.cjs` to use a fresh isolated headless Chromium profile and only local game files. It checks320/360/390px overflow, target sizes, node containment, all-stage real pointer wins, both natural failures, retry and repeated keyboard controls. It never attaches to the active cloud browser and never injects game state.

This runner was NOT completed: Chromium local IPC socket creation was blocked by the execution sandbox; the one normal escalation request returned TurnAborted. No retry or workaround was attempted. Therefore no independent actual-browser, screenshot, physical-phone or cross-browser pass is claimed. Parent is responsible for actual published CUA browser checks after deployment. The runnable test remains available for a suitable authorized developer environment.
