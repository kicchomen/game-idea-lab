# Echo Drum: independent review — 2026-10-19

## Scope and verdict

Reviewed the current engine, controller, markup and stylesheet against the latest README descriptions of prior games. Added `tests/echo-drum-independent.test.cjs` without editing production code. Initial result was 11/12 independent regressions passing. After the builder corrected overlapping-window matching, re-review passes all 12 independent regressions and all 37 focused engine/controller/independent checks. No remaining scoring blocker found; actual-browser validation remains separate and uncompleted by this reviewer.

## Corrected timing defect

The hit selector chooses the nearest unjudged note. Some adjacent notes are 300 ms apart while their inclusive ±160 ms windows overlap. A uniformly 160 ms late player has a valid hit on the earlier note, but the selector awards the upcoming note instead: the earlier note then misses and the following strike can become an extra error. The advertised tolerance therefore fails to compose across a phrase. Regression: a full performance at constant +160 ms must score 15/15 with no errors, just like constant −160 ms and exact timing. Verified correction: the engine now consumes the earliest unjudged note whose acceptance window contains the strike, preserving chronological order when windows overlap. Complete performances at −160 ms, exactly on time, and +160 ms each score 15/15 with zero errors.

The smaller markup issue is also corrected: the canvas accessible label now describes the actual single-lane call/response behavior instead of nonexistent upper and lower rows.

## Passing checks

- Fifteen notes, three distinct phrases.
- ±161 ms is outside the first note's window.
- Exactly three omitted notes still yield a 12/15 victory; four omissions terminate.
- Four off-beat strikes fail; one note cannot award two hits.
- Listening and early count-in ignore input without penalties.
- Pause freezes simulation and input, and resume preserves the same timing position.
- Terminal input cannot mutate a finished result; a new run clears counters.
- Frame partitioning agrees across the call/response transition.
- Engine operations do not mutate input state.

## Design assessment

The main verb is timed performance. That differs materially from yesterday's spatial clay-shaping and other recent planning/dispatch puzzles. Fixed phrases and visible response notes make this principally a visual call-and-response timing exercise, rather than a demonstrated memory challenge. The short prototype proves only that interaction, not hour-long depth or human enjoyment. The strict four-error limit is internally consistent with 12/15 success, although no beginner usability conclusion follows from scripted tests.

## Browser evidence and limits

Attempted a separate Playwright Chromium process with ordinary keyboard/pointer inputs, timed waits and DOM-only observations. The local browser failed before opening a page because socket creation was denied by the environment. The reviewed elevated launch also failed during sandbox setup with a read-only mount error. Consequently this review does not claim actual-browser success, failure, retry, repeated-operation, screenshot or responsive-layout verification. Parent verification must supply those results separately. The temporary browser script was not used to inject game state or invoke engine methods in the browser.

CSS statically provides 144–160 px drum targets, controls of at least 46 px height, fluid canvas sizing and a narrow-width rule. These are implementation observations, not proof of mobile layout correctness, physical touch usability, accessibility or novice comprehension.

## Article, design and artwork re-review

Read the latest design notes and article HTML and visually inspected both original PNGs. The cover is a coherent lantern-lit festival scene; the three-panel concept diagram has readable Japanese headings and clearly communicates watching, waiting and responding. They are concept illustrations, not screenshots, and the article explicitly labels them accordingly. The article correctly states that this prototype makes no sound and retains a visible response guide, while composition and broader cooperation remain ideas. No image defect requiring replacement was found.

Two article wording checks were reported to the parent: its final paragraph already claims browser-operation verification, which must remain pending until independently evidenced by the publishing/browser worker; and its post-failure retry instruction names 「はじめから」 although the terminal button is 「もう一度演奏する」 (「はじめから」 is available paused/between phrases). Also reported one design-note comparison correction: Spark Shield is turn-based telegraphed combat, so describe shared anticipation rather than claiming both games use reflex timing. These are documentation fixes, not new scoring defects.
