# 祭りのこだま太鼓 — design and verification notes

## Experience and scope

Player role: the reply drummer at a lantern-lit festival. Watch the lead drummer's short call, wait through four beats, and physically return its rhythm. Primary verb: strike at the right moment. The pleasure is in anticipation, a clean pulse and a chain of successful responses, rather than editing a plan and replaying a simulation.

The trial is a visual, guided call-and-response performance. It shows traveling notes during both the call and the response. Remembering the preview helps anticipation, but memory is optional; this is not a memory-only challenge. There is no audio. The drum, lanterns and moving notes are native CSS/Canvas artwork, not downloaded assets. No library, font, network call, analytics, account or storage is used by gameplay.

First 5–10 seconds: read four counts, watch the first four-note phrase, then strike the first reply. Ten-minute potential: internalize varied spacing and improve consistency. One-hour proposal: different festival bands, player-authored calls and arrangements shared between performers. Those broader features are concept directions only; none is implemented or validated. The fixed three phrases alone do not establish long-term replay value.

## Comparison with previous experiments

- Pottery Workshop: directly deform a persistent shape, inspect contour and fire when ready. This game measures transient strikes against real time; there is no editable final object or undo.
- Rail Dispatch: route independently moving objects through a contested intersection. Here there is one input, no route selection, traffic occupancy or resource allocation; anticipation is musical spacing.
- Pocket Forest: place discrete terrain and evaluate adjacency. This prototype has no spatial placement or board optimization.
- Spark Shield: react to combat tells and spend defensive resources. Both involve anticipation; Spark Shield uses discrete turn decisions, while this trial first presents a complete phrase and asks for the same temporal pattern, without opponents, damage actions or resource choices.
- Hush Courier and Windbird: move through a continuous world under danger or inertia. The drummer is stationary, and success depends on individual discrete timed actions rather than navigation.
- Footstep Echo and inference puzzles: choose sequential logical moves or uncover information. The rhythm is fully visible; execution, not hidden information, determines the result.

Reset always returns to the first call, zero score and zero errors. Successful early phrases stop at an explicit Next button; failed attempts stop immediately on the fourth error. There is no saved progression.

## Exact rules and architecture

Pure immutable shared engine: `games/echo-drum/engine.js`, loaded by both browser and Node tests. Browser controller maps inputs and renders engine state without owning separate scoring rules. DOM contains actual controls, readable cues, live result messages and counters. Canvas draws only the traveling notes and beat line.

One beat is 0.6 seconds. Each call and each response starts at time −2.4 seconds (four-count preparation) and ends at +3.6 seconds. Thus each stage lasts 6 seconds; each phrase takes 12 seconds, excluding between-phrase pauses.

Response note offsets after its count-in:

1. ひらく祭り: 0, 0.6, 1.2, 2.4 seconds (4 notes).
2. はねる提灯: 0, 0.9, 1.2, 2.1, 2.4 seconds (5 notes).
3. 夜空の返し: 0, 0.6, 0.9, 1.8, 2.4, 2.7 seconds (6 notes).

A strike matches the earliest unjudged note within tolerance when its distance is at most 0.16 seconds. Up to 0.08 seconds is “ぴったり”; the outer successful window says slightly early or late. The matched note is consumed. A strike outside all eligible windows is an extra-hit error. An unjudged note beyond its late window becomes one missed-note error. A late strike after the missed window can therefore be both a missed note and an extra hit, which represents two distinct errors. Four total errors ends the attempt immediately. At least 12 of 15 hits with at most three errors wins after phrase 3. Combo and best combo are informational; they do not modify tolerance.

Calls and most of preparation ignore hits. Reply input opens at −0.25 seconds so that an early first-note hit can be evaluated symmetrically. The visible hit button enables at the same moment. Inputs in terminal and paused states do not score.

Time advances from the monotonic browser clock, including synchronizing input timestamps before judging, so a strike is not limited to the previous animation frame. Engine transition code handles large valid time advances and does not miss crossing phase boundaries. The controller pauses automatically if an observed frame gap exceeds 250 milliseconds rather than unfairly scoring skipped beats. Window blur and hidden-page changes pause, clear held keys/pointers, and require explicit resume. Pause freezes the phrase exactly; there is no resumed count-in.

Pointer-down delivers one strike. A second simultaneous pointer cannot take over. Pointer-up/cancel clears ownership; ordinary generated click is ignored after pointer-down. Zero-detail clicks support keyboard/assistive native activation. Space key repeats and duplicate held Space are ignored; keyup rearms. Native control keyboard behavior is preserved. P and Esc toggle pause/resume. Retry is available while paused or between phrases; terminal replay starts a fresh performance.

## PDCA — 2026-10-19

Plan: test whether seeing a short phrase, waiting and striking its reply produces a distinct festival-performance experience without audio dependency.

Do: implement a clean one-lane stage, three different spacing patterns, four-count preparation, generous but bounded ±160 ms judging, visible first-hit guidance and cumulative failure/success. Keep the response guide to make the initial trial learnable.

Check: deterministic input-only routes achieve 15/15 and exactly 12/15. No-input playback and repeated off-beat strikes reach genuine failure. Controller tests cover focus interruption, repeated keys and full three-phrase success. Source review identified a stale canvas description referring to two rows despite the single-lane layout, a potentially misleading “音なしでも” label, and the risk that a now-hidden Start button could retain keyboard focus.

Act: describe one lane with textual phase cues, state “音は鳴りません”, permit game Space input when a focused native control is hidden, and announce scored input through the live status text. Keep claims honest: guided timing is implemented, obligatory rhythm recall and sound playback are not.

Independent review also found that overlapping windows around 0.3-second pairs let a +160 ms strike steal the following note under nearest-note matching. Matching now chooses the earliest eligible note, so both tolerance boundaries remain valid across all phrases.

Re-check: `node --test tests/echo-drum*.test.cjs` passes 37 checks: 15 engine, 10 mocked controller and 12 independent tests. These are not visual browser or human usability evidence. An isolated Playwright browser run was attempted: the bundled browser executable is absent, and installed `/usr/bin/chromium` aborts because its process-singleton socket is not permitted by the execution environment. The optional browser script is supplied, but has not run successfully here. Publishing/browser work must record its own live result.

Next playtest: Does a first-time player understand that the first round is only an example? Can they anticipate the 0.3-second pairs on a real phone? Does the first enabled strike feel timely? Does ±160 ms feel generous enough without rewarding random tapping? Compare guided response with gradually faded guidance before claiming a memory challenge. Add audio only after visual timing and device latency are evaluated.

## Reproduce and browser checks

Run focused deterministic tests:

`node --test tests/echo-drum*.test.cjs`

Optional ordinary-input isolated Playwright test (requires installed Playwright and Chromium):

`CHROMIUM_PATH=/usr/bin/chromium node tests/echo-drum-browser.cjs`

Set `ECHO_URL` to a hosted game URL to check the published build. The script opens a separate browser, checks 320/360/390px overflow and visible button sizes, captures screenshots under `/tmp`, waits for natural failure, verifies retry/pause, then uses ordinary timed keyboard and pointer actions for all 15 notes. It never mutates gameplay state or invokes engine transitions. It has not completed in this build environment.

Browser winning route, measured from clicking Start or the next-phrase button:

- Phrase 1: strike at 8.4, 9.0, 9.6, 10.8 seconds. At 12 seconds, click Next.
- Phrase 2: strike at 8.4, 9.3, 9.6, 10.5, 10.8 seconds. At 12 seconds, click Next.
- Phrase 3: strike at 8.4, 9.0, 9.3, 10.2, 10.8, 11.1 seconds. At 12 seconds, expect success 15/15.

Alternatively, watch notes crossing the vertical marker; the reply notes are mint and the text explicitly says “あなたの番”. Space or the drum button are equivalent. A strike within 160 ms of those timestamps counts. Tool and browser scheduling latency matters for automation; these are not a claim of human timing calibration.

Failure: start and do not strike. The fourth note times out at approximately 10.96 seconds after Start and the trial stops. Replay must reset score/errors. Pause after any strike; wait, resume and verify no added error during pause. Hold Space across one note and confirm only one strike. Check pointer release and second-pointer isolation. Verify no horizontal overflow, all controls at least 44px, and the bottom controls remain reachable at 320/360/390px. Source styles intend this but measured browser evidence must be recorded separately.

## Limits

No sound, alternate patterns, random generation, difficulty selection, calibration, reduced-motion mode, campaign, multiplayer, persistence or custom compositions. Timing is visual, so this is not a fully nonvisual-accessible rhythm game; live announcements and labeled controls do not substitute for nonvisual timing cues. Physical-phone touch, screen-reader experience, cross-browser behavior and first-time comprehension remain untested here. Concept art depicts the desired festival setting, not additional implemented modes.
