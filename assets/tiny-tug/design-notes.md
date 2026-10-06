# ちいさなタグボート — concept selection

## Player experiences considered

1. **Rescue skipper:** directly steer a growing convoy through a reef lagoon; feel responsibility for the last boat and decide when to head home.
2. **Market caller:** listen to changing customer requests and assemble orders under pressure; combine memory, rhythm and stock management.
3. **Creature caretaker:** teach a flock a call-and-response routine over several days; learn individual reactions rather than solve a fixed route.

Selected the rescue skipper: immediate steering feel, visible tail risk, and a decision that changes as the convoy grows. This is an original proposal for this lab, not a claim that towing games have never existed.

## Structural comparison

| Axis | Sensor Shift | Footstep Echo | Tiny Tug |
|---|---|---|---|
| Main verb | Edit angle, replay | Move/wait | Steer, collect, escort, return |
| Controlled object | Sensor parameter | Grid avatar and past position | Tug plus articulated convoy |
| Time | Observe autonomous playback | Discrete turns | Continuous action |
| Feedback | Ray and turn points | Delayed echo and gates | Wake, rope, corner-cutting, hull hits |
| Goal | Reach exit | Reach exit with gate open | Bring six stranded boats to harbor |
| Retry | Revise one angle | Undo or reset room | Restart a rescue run and change route/return timing |

## Concept before prototype size

- First 5–10 seconds: approach a stranded boat, see a rope connect and the rescued boat join the wake.
- After 10 minutes: choose one-, two- or three-boat return trips, approach reefs with space for the tail, and trade safe detours for mission time.
- After an hour in a developed version: plan several jobs across an archipelago, choose tug equipment and tow order for differently sized boats, and read changing tides and harbor approach conditions. These are proposed independent changes to route planning, handling, and mission selection, not implemented features or promises.
- Theme-mechanic link: the skipper's responsibility is spatially visible behind the boat; the tug clearing a rock does not mean everyone is safe.

## Prototype boundary

One lagoon and a short timed rescue mission test direct steering, automatic attachment, a trailing convoy, reef risk, harbor return and retry. Campaign, upgrades, jobs, tide cycles, sound and physical-phone evaluation are outside this trial. The concept images are illustrative, not screenshots of promised implemented features.

## Playtest record

Independent steering simulations cleared six single-boat trips in 44.53 seconds and two three-boat trips in 25.34 seconds, hull 5/5. A tight turn kept the tug clear but hit the tail; a slightly wider turn retained the convoy. These tests establish mechanical behavior, not player enjoyment.

Live cloud-browser controls attached and delivered a boat, displayed hull 5/5 and rescued 1/6, and paused/restarted correctly. Browser inspection found tall D-pad controls caused the upper board/HUD to leave a short viewport during steering. This observation prompted a compact horizontal control layout. Final responsive verification is recorded in the README. No human or physical-phone playtesting is claimed.
