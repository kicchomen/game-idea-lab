# 小さな駅の発車係 / Rail Dispatch

## Experience before mechanism

The player is a station dispatcher, watching three inbound sidings feed one shared junction. The pleasure is a deliberate departure followed by a visible safe arrival, and the tension is deciding whether to release a waiting train now or preserve a safe separation. This is live direct control, not a route editor followed by autoplay. Every released train stays committed to its chosen destination.

Compared candidates: a windmill courier would overlap recent Windbird continuous movement/energy; another landscape placement game would overlap yesterday's Pocket Forest; a train route-editor would repeat Sensor Shift's edit/run rhythm. Dispatch separates route choice from the time-sensitive decision to release, with feedback while time continues.

## Comparison and intended depth

- Pocket Forest: turn-based placements and habitat forecasts versus continuous time, arrival deadlines and shared track occupancy.
- Salvage Diver: voluntary resource retreat versus managing multiple independent moving commitments.
- Windbird / Tiny Tug: steering one moving body versus releasing independent vehicles without steering them afterward.
- Sky Plates: restore decaying targets by moving a performer versus an exclusive shared resource and committed departure actions.
- Hush Courier: spatial stealth windows versus responsibility for a small transport network.
- Sensor Shift: edit one parameter then replay versus continuous routing and releasing.
- Fossil Museum / Lost Property / Spark Shield / Footstep Echo: discrete inference, combat or delayed-position turns versus a live timetable.

First 5–10 seconds: send the first train, watch the junction turn occupied, wait for green and send the second while the first arrives. Ten-minute hypothesis: explore alternate dispatch orders and learn to distinguish the 3-second separation from the 5-second arrival cost. One-hour concept: passing loops, priority passengers, freight contracts, bidirectional sections and recoverable delay scoring could add planning; none are implemented. The current one-timetable learning trial is deliberately small, with no evidence yet of sustained replay value or novice-human fun.

## Implemented rules

- Three left-side waiting tracks A/B/C feed the central shared junction, then three right-side destinations: blue 港 / anchor, yellow 町 / house, green 山 / triangle. Text and shape supplement color.
- Twelve fixed trains. Each batch arrives at base + 0, 1 and 2 seconds on A/B/C, with batch bases 0, 11, 22 and 33. Each train has 12 seconds from appearance to arrival deadline.
- Route is chosen with the three destination buttons or keys 1/2/3. Release with A/S/D or the three siding buttons. A departed train keeps its route even if the switch changes.
- Every released train reserves the shared section for 3 seconds and reaches its destination after 5 seconds. Another train can depart while the earlier one is on the exit branch.
- Release into an occupied section or toward the wrong destination ends the trial with an abstract safety stop, never a wreck animation. Missing an arrival deadline also ends the trial. All 12 deliveries win; maximum 48 simulated seconds.
- An arrival exactly on the deadline counts before the lateness check. Empty siding inputs and duplicate immediate releases do not consume anything.
- Pure shared engine, 60 fixed simulation steps/second. UI animation uses a bounded accumulator. No dependencies, build, network calls, accounts, storage, analytics, audio or hidden randomness.
- Pause and explicit resume; blur and page hiding pause automatically. Repeat keydown suppressed, including native Enter/Space repetition. Retrying repeats the same schedule.

## Meaningful tradeoff and limits

Dispatching immediately frees waiting capacity and protects the arrival deadline, but the shared section prevents a burst of releases. Holding allows a different priority order, at the cost of the earliest train's slack. Waiting for a clear junction is necessary; waiting for the previous train to arrive wastes two usable seconds. There is no implemented queue-overflow penalty, platform upgrade, branching campaign or adjustable speed. Do not describe those as playable features.

A→B→C at base+0/+3/+6 wins at 44 seconds. B→A→C at base+1/+4/+7 also wins, finishing at 45. C→B→A at 2/5/8 loses because train 1 cannot arrive before its 12-second deadline. These are input-only production-engine routes, not state injection or success flags.

## PDCA, 2026-10-17

Plan: test whether a shared junction turns a simple destination match into a timing/priority decision without forcing twitch steering.
Do: build a compact fixed timetable, explicit occupancy countdown, arrival-deadline countdowns and distinct destination symbols. Keep failures safe and legible.
Check: deterministic successful and losing controls demonstrate that dispatch order can matter, and that waiting until arrival is unnecessarily conservative. A boundary test initially advanced 2.99 seconds using a 1/60-second clock, which correctly rounded to 3.00 and freed the junction; its expectation was wrong.
Act: test the final occupied step at 2.9833 seconds and the exact free boundary at 3.00 separately. Guard the start callback against duplicate activation while playing so a delayed second click cannot reset a running session. Add explicit rule text that a route change never reroutes a departed train.
Re-check: 20 Node engine/mock-controller tests pass. They include input-only wins, alternate order win, idle/priority/route/conflict losses, exact deadline and occupancy boundaries, deterministic replay, invalid actions, pause/resume, blur/visibility, key-repeat suppression and retry. These are not visual-browser, phone or novice-human results. Browser evidence must be recorded separately.

Next human questions: Can someone explain why green appears before arrival? Do they notice that the countdown is the arrival deadline, not a departure deadline? Does a safety stop feel understandable rather than arbitrary? If failures cluster around destination matching instead of timing, strengthen train/destination association before adding more tracks.

## Reproduce

Run: `node --test games/rail-dispatch/*.cjs` from repository root. Serve repository root and open `/games/rail-dispatch/`.

Browser winning route: press 勤務を始める. On each batch, select the waiting train's destination, then release A, B, C with the junction showing 空き before each next release. First batch: 港/A, 町/B, 山/C. Second: 町/A, 山/B, 港/C. Third: 山/A, 港/B, 町/C. Fourth repeats first. Aim releases around 0.3/3.4/6.5, 11.2/14.3/17.4, 22.2/25.3/28.4, 33.2/36.3/39.4 seconds. All arrive around 44.4 seconds. Early route selection is safe; don't release until the train has appeared.

Browser losing route: begin and wait 12 seconds, or choose 山 then release the initial 港 train from A. Retry should restore 0/12 and 0.0 seconds. For occupancy failure release the initial 港/A, wait for B at 1 second, choose 町 then release B before 3 seconds.

## Independent review corrections

The waiting buttons now explicitly say 「到着期限まで残」, and the trains carry destination names rather than only their train numbers, making the time constraint and route match visible. Motion now interpolates along the actual drawn track vertices: siding → bend at x200 → central junction at x300 → exit branch bend at x400 → station. At 2.3 seconds the train crosses the center while the section remains reserved; at the 3-second release boundary its complete 46px body has cleared the central 16px junction marker. Engine geometry regressions check all nine origin/destination combinations along the polyline.

A separate polite, atomic screen-reader live region reports each newly arriving train and each occupied→free junction transition. Countdown updates are not live announcements. Regression tests count DOM writes to confirm ordinary frames and paused frames do not repeat those announcements. These are mocked-controller accessibility checks, not actual screen-reader usability validation.

Difficulty limitation: A→B→C is the obvious strong default throughout the fixed timetable. An alternate B→A→C success demonstrates some slack, not rich long-term scheduling strategy. This is a simple timing/attention prototype; long-term depth, replay motivation and novice-human comprehension remain unverified. A later design should vary genuine priority tradeoffs before expanding timetable length.
