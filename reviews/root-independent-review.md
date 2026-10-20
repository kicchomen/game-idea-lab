# Independent code review — 2026-10-20
Reviewer: parent, separate from implementer. Scope: engine.js, app.js, index.html, style.css static inspection. Not a browser or human playtest.

## Finding requiring correction
Keyboard aliases collapse into one logical Set entry. Holding ArrowLeft and A then releasing either deletes `left`, despite the other physical key remaining down. Same for Right/D. Track physical codes/keys and aggregate actions, with tests for either release order, then release all on pause/blur. Repeated-key handling should not introduce stuck state.

## Positive observations
- Continuous unstable lean/momentum feedback differs structurally from edit/replay and rhythm imitation.
- Bracing reduces instability but halts travel while time continues; meaningful tradeoff.
- Explicit balance loss and timeout, success, reset and pause states exist.
- Blur/visibility interruption clears controls and prevents background time jumps.
- Touch pointer capture/cancel handlers and minimum target sizes present.
- Prototype and larger concept scope distinguished; no educational/fun guarantees.

## Remaining checks
- Actual touch/keyboard operation at 320/360/390 and PC; particularly pointerleave behavior with capture and simultaneous brace/steer.
- Large dt auto-pause and resume.
- Engine dt=1 at time boundary and zero dt terminate correctly.
- Caption/illustration agreement must be inspected separately.
- File footer states no real-device/first-human validation, appropriately.

Status: conditional code-review pass after alias bug fixed/tested. Publication still requires the requested actual browser QA and deployment verification.

## Recheck 2026-10-20 01:18 UTC
Physical-key Map fix inspected: code identifiers retained separately and held(action) aggregates values. Focused engine/controller tests independently rerun: 28 pass. Alias issue resolved.
Concept cover and three-panel art visually inspected: balance pole, wind and crossing align with prototype role; article explicitly calls them concept images, not screenshots. Article is concise and separates future routes/equipment from implemented single crossing. Do not retain the final article claim of completed viewport tests until those actual tests finish; currently they remain pending.
Status: static/content/illustration review PASS; publication conditional on actual browser width/control checks and deployment verification. Not a real-device or human first-play assessment.
