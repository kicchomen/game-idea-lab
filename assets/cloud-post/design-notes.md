# 雲の郵便飛行船 / Cloud Post — 2026-10-30

## Role and core experience
A postal-airship captain decides which two of four drawn cards to use today. Progress, repair and earnings compete for those two actions. A purchased card enters the discard pile, not the hand; it becomes useful only when the deck runs out and the discard pile is reshuffled. The intended pleasure is seeing an earlier investment return in a later hand, while keeping the ship intact long enough to deliver.

This is a small deck-building design, not a claim to have invented that established genre. We rejected a visual baggage-inspection idea as too close to Lost Property's limited-investigation decisions, and an area-enclosure game as largely the traditional Dots and Boxes rules. The selected core adds hand cycling and composition control not present in the current 26 prototypes.

## Structural comparison
- Waterwheel Week: persistent workshops automatically produce every day; here purchased abilities are intermittent cards, with hand limits, cycling delay and dilution.
- Night Market: buy stock then sell it to uncertain customers; here purchased cards are not consumed merchandise and repeatedly return to the player's action options.
- Shell Auction: bid against rival budgets to assemble a final collection; here no opponent/bidding and every purchase changes future action availability.
- Spark Shield: fixed action menu and telegraphed combat; here action availability itself is a deck the player builds, with no enemies or combat.
- Earlier Sensor Shift / Footstep Echo / Packing Truck: parameter/temporal/spatial puzzles; this is not setting one configuration and watching a replay. Each played card changes state immediately and future hands inherit purchases.
- Recent Mist Cartographer and Simmer Stall use route exploration / continuous timing; this has turn-based hand decisions and no time pressure.

## Scope versus wider game
First 5–10 seconds hypothesis: choosing a movement or income card visibly changes the airship or budget. Ten-minute hypothesis: compare early investment versus progress, repair timing, and the delayed return of bought cards; buying too many tools can delay wanted cards. One-hour concept: choose routes with different weather and services, specialize the deck, and accept different delivery commitments. Those route/events/campaign systems are NOT implemented. The fixed seeded short voyage can become memorized; repeated-play depth and first-time human understanding remain unverified.

## Prototype boundaries
One fixed route, 8 days, distance28 goal, hull10 maximum, end-of-day wear2, 4-card hand and2 plays/day. Three market cards; one purchase/day after both plays, funds carry over. Used and unused cards go to discard at day end. Purchasing does not place the card directly in hand. Arrival is immediate, before that day's wear. No real aviation/finance simulation, multiplayer, save, audio, account, analytics or game network calls.

Existing repository uses dependency-free static HTML/DOM games. Keep that architecture for a card UI rather than adding a game engine or remote dependency. engine.js owns immutable state transitions and seeded shuffle; app.js owns rendering/input; Node tests exercise the same production engine.

## PDCA
Plan: implement future-hand investment, not a fixed menu disguised as cards.
Do: enforce two plays/day, market after plays, discard purchase, finite route/hull, explicit deck/hand/discard counts and purchased-card badges.
Check: compare no-purchase bound to a legal purchase-and-use success route; independently review state boundaries and real browser inputs. Initial source review found a narrow-screen SVG crop: `slice` clipped the starting ship and final flag at phone widths.
Act: replace with `meet` so the whole progress illustration remains visible at narrow widths. Actual review/test results are recorded separately before article publication.

## Independent pre-browser review
The reviewer separately inspected engine/app/CSS and production tests. Found and fixed narrow illustration clipping (`slice`→`meet`). Day terminology was normalized to avoid confusing one journey with eight separate delivery services. Added independently written random-state invariant tests (300 runs, up to60 actions each), direct kit/express effect checks, and a layout-source regression. These tests are not browser or physical-phone tests. The initial existing suite was772/772; final suite count is in automated-test-results.txt.
