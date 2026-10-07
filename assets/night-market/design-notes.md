# 夜市の仕入れ番 — 体験設計と試作記録

Date: 2026-10-07. Dependency-free HTML/CSS/JavaScript prototype. These notes describe a small experiment, not a claim of a validated full game.

## Experience first

The player is a night-market stall keeper who knows the early regulars but not the final passer-by. The intended emotional sequence is: read a small queue → commit a basket → hand over a complete meal → hesitate before paying to keep the lantern lit → accept the cost of leftover stock. The theme explains every rule: limited physical basket space, a night-opening fee, and perishable food.

Shortlist considered before locking the implementation:

- Market keeper: manage scarce stock and decide whether to remain open; selected because uncertainty and money commitments differ from prior prototypes
- Creature caretaker: infer needs from behavior and alternate feeding/rest; deferred because a useful prototype needs richer behavioral feedback
- Repair courier: route jobs against a shared tool inventory; deferred because an initial grid could collapse back into another deterministic path puzzle

## Difference from previous games

| Dimension | Sensor Shift | Footstep Echo | Tiny Tug | Night Market |
|---|---|---|---|---|
| Main verb | Adjust/replay | Move/wait | Steer/tow | Buy/serve/close |
| Object | Sensor angle | Self and delayed echo | Tug and convoy | Stock, cash and customer orders |
| Time | Automated playback | Discrete turns | Continuous real time | Six untimed rounds |
| Feedback | Path/collision | Spatial gate state | Rope, tail and collision | Sale, fee, remaining stock and cash |
| Goal | Reach an exit | Solve a room | Rescue six boats | End with at least 40 coins |
| Retry | Re-edit one parameter | Undo/reset route | Repeat a steering attempt | Replan the same seeded market or draw a new one |

This is neither a renamed edit-one-knob puzzle nor a reflex challenge.

## Scope and depth

- First 5–10 seconds: two definite orders, three foods and obvious +/− controls make the first purchase possible; a correct sale visibly grows cash. This is a design intention, not measured novice behavior.
- After roughly 10 minutes: compare serving both regulars with reserving stock for higher-paying late customers; use overlapping recipes to cover multiple forecast candidates; recognize that sunk stock cost differs from the incremental two-coin extension fee; adapt risk to proximity to the final target. Same-seed retry supports counterfactual learning. Actual ten-minute human engagement remains untested.
- Potential one-hour expansion, **not implemented**: route between markets with different customer information; negotiate guaranteed preorder deposits; choose refrigerated capacity versus sales capacity; introduce patrons whose repeat custom changes future queues. These change information, investment and long-term relationships rather than merely adding more generated rounds. Whether they support one hour of enjoyment remains unproven.

Implemented now: three goods, six basket slots, six nights, two known sequential customers per night, three equally weighted late-customer candidates, paid optional extension, complete-order-only sales, end-of-night spoilage, success/failure, same-seed retry and fresh seed. No timers, dependencies, network requests in gameplay, accounts, storage, audio, campaign or upgrades. An ordinary static server can serve the folder; Node can require the engine directly.

## Exact economy

- Starting cash: 12. Goal: final cash >=40 after night six
- Tea costs 1 per unit; rice and fruit each cost 2; total stock capacity 6
- Known customer price: ingredient cost +2 or +3
- Late customer price: ingredient cost +8
- Inviting a late customer costs 2 immediately, with no refund for an unservable order
- Three displayed forecast entries each have probability 1/3. Duplicate entries intentionally represent greater weight
- Inventory purchases can be undone for full price before opening; never after opening
- Leftovers have zero recovery value and disappear at closing
- Seed deterministically fixes all six queues and all six actual late arrivals; retry preserves that seed

At extension time, inventory purchase cost is already sunk. A rational expected-cash decision compares the average serviceable late sale against the two-coin fee. Before purchasing, both acquisition costs and lost capacity must be included. The UI displays how many forecast candidates current stock can serve without selecting for the player.

## PDCA 1: give late opening a reason to exist

**Plan:** Test whether the information gap changes stock planning, not merely whether a random event can be displayed.

**Do:** Implement the six-night loop with late price equal to ingredient cost +5. Add an exhaustive, forecast-only one-round planner that enumerates affordable baskets and four known-service choices, then compares expected late revenue against its fee. The planner never reads the actual hidden candidate. Compare against an exhaustive known-customer-only planner and a deliberately naive uniform-basket/always-extend policy.

**Check:** On 200 fixed seeds (`test-0`…`test-199`), the +5 forecast policy averaged 42.295, versus 42 for conservative play. It reached the target in 176/200 games versus 182/200 for conservative play. The extension offered too little upside to justify highlighting it as the game's distinguishing decision.

**Act:** Probe late premiums of +6, +7 and +8 on the same seed set. Select +7: greater payout potential without making risky play nearly universal success. +8 reached a 48.04 average and 191 wins, making it a weaker candidate for this learning-oriented trial. Also keep all forecast weights explicit and repeatable.

**Intermediate re-check, +7 rules before structural revision:**

| Policy (200 identical seeds each) | Mean final cash | Wins >=40 | Min | Max |
|---|---:|---:|---:|---:|
| Forecast-aware, maximize this night's expected cash | 45.065 | 185 | 30 | 61 |
| Conservative, known customers only | 42 | 182 | 38 | 47 |
| Buy 2 of each when affordable, serve in order, always extend | 8.345 | 0 | 0 | 39 |

These are deterministic automated policy probes, **not human playtests**. The planner is myopic rather than optimal for six-round win probability. It is not a fair skill study against the deliberately naive baseline. The wide risky range (30–61) versus conservative range (38–47) shows an upside/downside tradeoff; it does not establish satisfying balance. Conservative play still won 91% of this intermediate sample. Independent review correctly flagged that every pair of 2–3 item known orders fit the six-slot basket, undermining the intended conflict. This version was rejected; see PDCA 3 below.

## PDCA 2: input and accessibility safeguards

**Plan:** Prevent repeated input from silently advancing several decisions; maintain keyboard focus and clear result states.

**Do / Check:** Add controller fixtures for all six rounds, failure/success, same-seed retry, fresh seed, insufficient stock, capacity, and extension. Check that a previously removed button cannot be reused to fire another purchase; suppress held Enter/Space repeat activation. Rendering replaces interactive nodes, so preserve focus on a matching enabled action or the next decision button. Keep the live status region outside the replaced subtree so updates occur in a stable announcement target.

**Act / Re-check:** 16 automated tests pass (11 engine/simulation and 5 mocked-controller). Tests cover deterministic reproduction, immutable actions, invalid goods/phases, cash/capacity/refunds, complete-order sales, single fee charge, spoiled stock, exactly six rounds, insufficient extension funds, reachable success, repeated/stale events, keyboard-repeat prevention, terminal failure and reset/new seed. Mocked DOM tests are not proof of browser layout or assistive-technology behavior.

## PDCA 3: fix the structural lack of competition

**Check:** Independent review found that two known orders always fit six slots. The +7 payout tuning alone was insufficient: safe play won 91% of seeded runs. Review also identified crowded narrow-screen counters and the distance between the current order and its action buttons.

**Act:** Add six four-item recipes: permutations of (2,2,0) and (2,1,1). A pair can now require seven or eight items, so serving every known customer is not always possible. Keep the basket capacity at six and set the late premium to +8 after a same-seed probe. Repeat the full current order immediately above Serve/Skip. At 520px and below, render goods as full-width compact rows with their own 44px +/− controls. Remove the unmeasured estimated play duration.

**Final re-check:** 200 identical seeds per policy:

| Policy | Mean final cash | Wins >=40 | Min | Max |
|---|---:|---:|---:|---:|
| Forecast-aware, maximize this night's expected cash | 41.005 | 126 | 27 | 54 |
| Conservative, known customers only | 37.48 | 55 | 29 | 45 |
| Uniform basket / always extend | 3.42 | 1 | 0 | 45 |

The default seed ends at 41 under the forecast-only policy and 38 under the conservative policy. An explicit regression verifies that altering all hidden late-arrival indices cannot alter the planner's first decision; another checks that the same policy sometimes extends and sometimes closes. The final recipe set also has an explicit capacity-conflict regression. These are meaningful mechanical differences, not evidence of human enjoyment or fully balanced difficulty. Outcomes remain partly random; players can improve coverage of the three visible candidates, but cannot guarantee a particular late arrival. The known-customer-only policy is an exhaustive myopic comparison, not a deliberately careless baseline.

## Verification commands

`node --test tests/night-market*.test.cjs`

`node --check games/night-market/engine.js`

`node --check games/night-market/game.js`

## Browser status and remaining questions

Local browser navigation through the provided CUA browser to `http://127.0.0.1:8766/games/night-market/` was blocked with `net::ERR_BLOCKED_BY_CLIENT`. The implementation worker did not bypass this restriction. Live browser QA must use the parent task's authorized published preview. Mobile widths, visual layout, actual keyboard behavior, physical phone touch, cross-browser and real screen-reader interaction are not established by the Node tests.

Next human-playtest questions:

1. Can a newcomer explain why a full basket may lose money?
2. Do they understand that the last order must be served in full and each forecast entry has probability 1/3?
3. Does the extension decision cause considered hesitation, or is conservative play obviously sufficient?
4. Does same-seed retry feel like useful learning or merely a spoiler of the last arrival?
5. Is the vertical distance between the queue and action buttons tolerable on a phone?

Stop expanding if players cannot describe the core risk. Improve that decision and its feedback before adding a campaign.


## Live browser verification (2026-10-07)

Pages workflows37555980862 and37556068086 succeeded for the implementation and QA harness commits. Actual cloud Chromium UI operation inside a390px iframe completed all six nights at41 coins, retried the same seed, completed a no-stock failure at12, and started a different market. Keyboard activation was used for the full route; mouse buy/refund controls were exercised at320/360/390px iframe widths. The scrollbar leaves client widths305/345/375 respectively, each equal to scrollWidth. Stock buttons measured44×46px. Screenshots stored alongside these notes. Physical phone touch, other browsers and novice understanding remain untested.


## Publication

Published2026-10-07 13:49 JST at https://game-idea-lab.blogspot.com/2026/10/blog-post_07.html (Blogger2227938574447171811). Two generated JPEGs were imported through the Blogger editor's built-in image conversion and saved as Blogger CDN URLs. Full article source reread exactly matches the saved file; no data URIs remain. Smartphone preview operated embedded buy/refund/open controls. Narrow standalone preview tested320,359 (slightly narrower than360) and390 CSS widths; article elements stayed within the viewport. Blogger's own diagonal preview watermark overflowed at320, which is not part of the published article. Public title, thumbnail, both images and playable iframe were verified. Public2/draft2 preserves the two earlier drafts. Physical phone touch and novice playtesting remain unverified.
