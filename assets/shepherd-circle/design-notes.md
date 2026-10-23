# 丘の牧羊犬 — 2026-10-23

## Preflight and editorial boundary
Read the repository README, recent Meadow Camera design notes and engine, Tiny Tug's documented rules, Roadside Bargain publication record, and the existing game directory structure. This repository uses per-game assets/design-notes.md, article files and publication.json ledgers. This file records implementation and automated evidence only. Parent publication work owns article/deploy/live-browser records; no publication is implied here. Existing games and README were not changed by the prototype implementer.

## Player experience and selection
Become a sheepdog. Your direct action is where to stand and walk; the consequence is autonomous animals moving away from your pressure and back toward their own flock. The first experiment is to discover that chasing a sheep from the entrance side sends it the wrong way, while going around behind it helps. This is not a flock attached to the player.

Candidate experience comparison:
- Sheepdog: circle a living group, apply proximity pressure, back off and recover strays. Chosen for a visible indirect-control relationship with room for different routes.
- A baker dividing shared oven space: an attractive material/ordering idea, but a small implementation risks repeating Night Market's resource assignment and queued-order decisions.
- A lantern keeper guiding travelers: could become another routing/signaling puzzle close to Rail Dispatch or an edit-then-run prototype. Not selected without a clearer distinctive action.

Recent-game contrasts: Roadside Bargain proposes discrete numeric exchanges; Meadow Camera observes independent motion but does not change subjects' movement; Rope Walker counter-steers balance; Echo Drum reproduces timing; Pottery shapes bands. Tiny Tug directly steers with attached followers and a growing convoy. Here sheep are never attached, do not follow a dog trail and do not seek the pen; they autonomously respond to dog distance and other sheep. Continuous position feedback, flock split/recovery, and collecting all four before sunset distinguish the loop from those games and from the older edit-parameter/run puzzles.

First 5–10 seconds hypothesis: place the dog left of the flock and see its pressure move the group. Ten-minute hypothesis: compare a broad gentle approach with rushing through the group, learn how to recover a stray and reduce the collection time. These are hypotheses, not observed enjoyment. Hour-scale proposed breadth: different gate positions, terrain that changes approach routes, sheep with distinct comfort distances, larger flocks and staged trail drives. None of these systems is implemented, and the fixed four-sheep field does not currently support a credible hour of content.

## Implemented rules
One 600×420 logical field, four sheep, a right-side opening y105..315 at x500, seventy active simulation seconds. Success requires all four saved; sunset is the only failure. There are no lives, dog-sheep damage, scoring bonuses, random events or hidden adaptive assistance.

Dog: click/tap selects a clamped destination; the dog walks straight there at145 logical units/second. It can walk through the fence (a deliberate simplification: only sheep are constrained by the fence). Arrow/WASD keys and held direction buttons give normalized direct movement; releasing directional input stops the dog. A keyboard/screen-reader activation of a direction button requests a32-unit step. Wait/Space stops the destination without freezing the sheep. P/Escape or Pause suspends time, clears held controls and removes the old destination. Window blur or document hiding also pauses; resuming is explicit. Retry returns to the briefing and original layout. Space preserves native button activation when a button has focus.

Sheep: inside155 units of the dog, repulsion speed is36×(1−distance/155)+9, away from the dog. A zero-distance overlap has zero radial vector until either animal moves. Each active sheep also moves toward the active flock's centroid with proportional coefficient0.34; pair separation acts below30 units with coefficient0.8. Total sheep speed is capped at48 units/second. The integration uses all sheep's previous-step positions, avoiding update-order artifacts. No goal vector, scripted route, attachment or breed-specific behavior exists. Safe sheep are excluded from flock calculations and displayed in four marked pen positions. Sheep save once their centers reach x512 while y117..303; fence collision stops their centers at x488 outside that safe opening. Sheep are bounded by the field. Pen capture is intentionally permanent.

The controller accumulates a fixed1/120-second simulation step. Frame intervals up to2 seconds are accumulated in full, so ordinary low-frame-rate rendering does not slow the game clock. A gap greater than2 seconds explicitly pauses, discards that gap and clears input. Resuming resets the frame clock so paused elapsed time cannot be consumed. The engine tick API accepts one step at most, so tests use the same STEP loop. The countdown measures elapsed active play, excluding explicit pauses and discarded long interruptions. Rendering can still be visually coarse at low frame rates. No external dependencies, network calls, accounts, analytics, storage, audio, fonts or image assets are required.

## PDCA during implementation
Plan: make a responsive indirect-herding trial with actual recoverable steering and a demonstrable complete route.
Do: implement deterministic dog targeting, pressure/cohesion/separation, visible pressure circle, fence gate, saved count, time limit, pause/restart and large directional controls.
Check: the first trial at y215 saved three sheep but pushed the fourth below the opening. Moving the dog's route slightly downward to y225 lets all four enter. This reveals meaningful approach-angle sensitivity, but is not evidence the calibration is easy for newcomers. No-goal-attraction, reverse-direction repulsion and deterministic replay tests guard against an easy scripted win.
Act: preserve that physical distinction rather than adding a hidden success trigger; add explicit beginner text about standing to the left/behind the group, visible destination/pressure markers, saved-count feedback, a Wait button and interruption cleanup. Save the complete route as reproducible QA evidence rather than an automatic-play feature.
Independent source review found that multiple aliases for one direction could bias a diagonal. The controller now aggregates unique logical directions across keys and pointers, with a matching regression.
Recheck after timing correction:26 Node tests passed:15 production-engine tests and11 mocked DOM/canvas controller tests. The controller success route executes the actual pointer handlers and production fixed-step loop. Those tests are not a real-browser, touch-device or human playtest. Live viewport results are to be recorded separately by the publishing/QA worker.

## Reproducible QA routes
Start via「牧羊をはじめる」. Keep browser focus because blur pauses.
1. Tap logical(220,225):36.667% across the canvas and53.571% down. Wait until12 active seconds have elapsed, approximately残り58秒.
2. Tap(330,225):55% across, same height. Wait until24 active seconds have elapsed, approximately残り46秒.
3. Tap(435,225):72.5% across, same height. All four enter at25.38 simulated seconds in fixed-step tests.
A wall-clock wait can be longer on a throttled renderer; use the visible timer. Pointer positions must be relative to the canvas, not the surrounding card. A separate production-engine sweep also succeeded at y221/223/225/227/229 with10/12/14-second waits for each target (15 combinations). This establishes limited coordinate/timing tolerance, not live-browser or human comprehension.

Failure: start and do not move. Flock cohesion does not move its center toward the goal; sunset occurs at70 active seconds and0 saved. Retry shows the briefing at70 seconds and0/4. Pause/resume must freeze and restart active time; backgrounding must pause and discard held inputs. Hold a direction then release/cancel; test keyboard aliases (ArrowRight + D, release either) and repeated P keydown. Repeated Start during play does not restart.

Responsive targets:320,360,390 CSS px, plus narrower embedded content if the article has padding. CSS includes border-box sizing, a fluid600:420 canvas, no minimum page width, five equal directional cells,48px minimum button heights, focus outlines and polite status text. Measured/visual browser fit is not asserted by CSS inspection alone.

## Honest limitations and next observation
One fixed starting layout with a wide opening and no terrain; the successful route can be memorized. Nearby cohesion can feel counterintuitive as the last unsaved sheep loses flockmates. Animals have no inertia or grazing animation. Dog can cross the fence. The canvas does not expose continuously updated individual coordinates to screen readers; semantic controls and status text do not establish complete nonvisual playability. No physical phone, simultaneous-touch, screen-reader, cross-browser, first-time-human or long-term enjoyment test has been performed by the implementer. No claim that the prototype is fun, sufficiently deep or realistic animal behavior.

Next human questions: can a newcomer infer which side to stand on without the QA recipe; is stopping to let the group settle an intentional choice; does recovering a stray feel understandable rather than arbitrary; and is one extra attempt appealing? Observe these before adding more fields or asserting a game design has been validated.

## Live low-frame-rate correction
Parent CUA observed only about6 active seconds passing in70 wall seconds in an active iframe. The original100ms frame cap was inappropriate for roughly1fps rendering. Changed the normal controller, not the tests or game speed, to consume all intervals up to2 seconds in fixed1/120-second steps; longer gaps pause explicitly without consuming the gap. Added1fps equivalence, long-gap pause/resume and1fps pointer-route regressions. Browser recheck belongs to the parent.

Position-based route checkpoints: after the first destination, wait until the unsaved flock spans approximately x373–401,y200–235 (63–67% of canvas width). After the second, wait until it spans x484–508,y191–228 (81–85%, beside the gate). Then choose the third destination. These are visual alternatives to waiting a prescribed wall-clock interval; they do not change the steering rules.
