# Independent review: 光の舞台係

Result: **PASS for static code and Node regression review**, 2026-11-04 UTC.

Scope: `games/followspot/{engine.js,app.js,index.html,style.css}` and `tests/followspot*`. No gameplay source was modified. Browser execution and publication are outside this review.

## Verified

- Independently ran `node --test tests/followspot-*.test.cjs`: **30 passed, 0 failed**.
- Fixed-step scoring, cue boundaries, cooling, overheat recovery, pause, restart, terminal-state guards, and invalid-input rejection are covered and consistent with the visible instructions.
- Keyboard movement stores physical aliases independently, so releasing ArrowRight does not clear a still-held D. Repeated toggle keydowns are ignored. Space is handled during play before native activation on the initial keydown. Pause/resume and replay focus targets exist and remain enabled.
- A separate deterministic keyboard-axis simulation, using no direct aim assignment, prepositions during blackout and scores **84.51/70**, with zero overheats. This establishes keyboard reachability, not a human usability test.
- Pointer cancellation/lost capture, opposite simultaneous holds, secondary stage touches, and background interruptions have regression coverage.
- Help pauses active gameplay, makes background sections inert, traps Tab on its only action, and restores the previous play/pause state on close.
- CSS contains narrow embedded-view adaptations and a two-column landscape layout at width >=600px and height <=500px. The supplied viewport fixture includes 258×568, 320×568, 360×640, 390×844, and 667×375.

## Required fixes

None found within this review's scope.

## Limits and remaining checks

- No browser was used. Actual clipping, SVG coordinate alignment, touch capture, native button keyboard activation, zoom/font scaling, and platform-specific focus behavior must be verified through the parent's browser QA.
- Controller tests use a minimal DOM mock: they do not emulate native button defaults, inert enforcement, CSS layout, or real pointer capture.
- The responsive fixture is a manual measurement aid, not an automated pass/fail layout test. Test ready, playing, paused, help, and terminal overlays, not just the initial screen.
- Very short viewports narrower than 600px do not use the landscape layout. Such dimensions and enlarged text are not established as supported by this review.
- Full nonvisual playability is not established: actor positions are primarily visual, despite labeled controls and live cue/result announcements.
