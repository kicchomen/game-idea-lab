# 山あいの綱渡り / Rope Walker — 2026-10-20

## Preflight and selection
At 2026-10-20 01:09 UTC, the existing Blogger post list (blog 3556407006374124911) contained 14 published posts, exactly two older drafts (Sensor Shift and Footstep Echo), zero scheduled posts, and no October 20 work. Public feed independently matched 14 published posts through Echo Drum. GitHub main was 1fc72ddad3e0830595e9bdb25e45218b9a8bbb97; main was the only branch and no PR was open. README, prior design notes and publication records were read. No separate editorial/ledger document existed; per-game publication.json and README are the existing ledger. Old drafts and prototypes stay untouched.

## Start from the player experience
A travelling performer trusts their own small corrections while crossing a misty valley. The core pleasure is feeling a lean settle after releasing a corrective input early, then choosing whether to keep walking into a forecast gust or stop and brace. The primary verbs are counterbalance, release and brace. This is direct continuous feedback control, not adjusting a parameter and replaying a predetermined simulation.

Candidates compared: a bakery would repeat Sky Plates' maintenance deadlines; a gliding courier would repeat Windbird; a tightrope crossing changes the direct-control target from world position to unstable body lean and momentum. Theme and mechanics connect: moving the balancing pole changes acceleration, release retains momentum, bracing restores stability while consuming the crossing's time budget.

- Echo Drum: discrete strikes against visible temporal targets; Rope Walker continuously controls a physical state, with no copied pattern or scored taps.
- Windbird: steer a body spatially and spend/recover flight energy; Rope Walker advances automatically, and controls the stability of that advance. There is no energy meter, thermal route or altitude target.
- Tiny Tug: convoy steering around obstacles; no cargo, attachment or path routing here.
- Sky Plates: choose among several degrading targets and travel between them; only one coupled lean/velocity system here, with instability and overshoot.
- Hush Courier: choose movement speed and hide in spatially limited windows; this prototype continuously counteracts force rather than avoiding an observer.
- Sensor Shift and prior puzzles: no edit/run phase, hidden clues, undo or discrete board solution.

First 5–10 seconds: see the lean grow, apply a short counterweight correction, release and watch it settle. Ten-minute hypothesis: learn to counter momentum before the lean itself reaches center, anticipate wind reversals, and reduce bracing. One-hour proposed breadth: route choice across different ropes, pole properties, wind exposure and optional performance flourishes. Those are proposals, not implemented or validated. One fixed crossing is not evidence of sustained replay value.

## Architecture and exact implemented scope
Follow the repository's dependency-free static architecture, rather than add Phaser/CDN/build dependencies for this small core. Engine owns state and deterministic physics at 120 Hz; DOM owns text and native controls; Canvas2D renders the scene. No storage, account, analytics, audio or gameplay network calls. Original generated concept art is editorial, not runtime artwork.

One 60m rope; 55-second deadline. Walking is automatic at 2.5 * max(0.3, 1 - abs(lean)*0.45) meters per second. Normal acceleration = 0.45*lean + 0.65*wind + 1.8*steer - 1.2*velocity. Bracing stops forward movement and uses acceleration = -0.5*lean + 0.22*wind + 1.8*steer - 3*velocity. Thus bracing offers genuine restoring/damping behavior but cannot win without walking. Lean reaching +/-1 triggers an abstract safety-rope stop, not a falling animation. Reaching the far platform wins; time expiration loses. At a shared final timestep, balance failure is checked before arrival, arrival before deadline.

Wind values (seconds, signed direction): (0,+0.25), (5,-0.65), (11,+0.8), (17,-0.9), (23,+0.55), (30,-0.75), (37,+0.85), (44,-0.6). Forecast shows the next reversal and time. No random wind, hidden safety snap or automatic corrective steering. Retry restores the exact original conditions. Pause freezes all state. Window blur, hidden page and frame gaps over 250ms pause; resume is explicit and clears held inputs.

Controls: arrows/A/D for held left/right counterweight, Space for held brace, P/Escape for pause/resume; three large pointer-held buttons support simultaneous brace/counterweight. Release, pointer-cancel, lost capture and pointer-leave clear the relevant pointer. Native start/retry button keyboard activation remains available. Key repeats do not multiply forces.

## PDCA
Plan: determine whether overshoot and forecast gusts create a readable balance-control experiment.
Do: implement one rope, deterministic wind, automatic stepping, held counterweight, held brace, terminal states and interruption handling.
Check: first force +0.42 produced an idle loss in 3.85 seconds, too little time to understand the controller. Brace initially retained a positive unstable lean term, meaning prolonged bracing could still fail from a small bias instead of its intended time tradeoff. Terminal active button styles could remain stale after transition.
Act: soften the opening force to +0.25; give brace a restoring -0.5*lean term; clear all controls before rendering terminal states. Bound the final integration step to the remaining deadline to keep time/braced duration precise. Preserve the genuine no-input loss and automatic movement.
Recheck: 16 engine tests and 12 mocked DOM-controller tests pass. Input-only feedback routes cross in about 24–25 seconds; bracing first then correcting also wins; wrong held input loses, no-input loses, brace-only times out without advancing. Controller tests cover visible-state feedback success, repeated input, cancel, pause, interruption, timeout and retry. These are simulation/mock tests, not browser play or human evidence.

## Validation limits and next question
Actual browser, responsive layout, Blogger saved-preview and CDN readback must be recorded separately before article publication. Isolated headless Chromium could not start in the execution sandbox (socket restriction); supported escalation also failed before browser launch. The shared cloud browser is the supported live testing route. No physical-phone, screen-reader, cross-browser, novice-human or long-term-enjoyment claim is made.

The next real-user question is whether left/right feels like moving the balancing pole rather than changing walking direction. Does the player discover that releasing before the center prevents overshoot? Is bracing a useful recovery move or does it feel like waiting? Measure this before expanding to additional ropes.

Independent parent code review found that keyboard aliases shared a logical Set: releasing A stopped a still-held Left arrow. Changed held-key tracking to physical IDs mapped to actions. Added both release orders for both direction pairs and case-change regression. All 28 focused tests pass after correction. The original review is retained under reviews/root-independent-review.md.
