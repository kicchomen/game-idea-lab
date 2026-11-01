# Independent Harbor Crane review — 2026-11-01

## Scope
Read production engine/controller/HTML/CSS. Independent Node tests are in `tests/harbor-crane-independent.test.cjs`. These are engine and mocked DOM/controller checks, not an actual browser playtest, physical-phone test, or novice-human fun test.

## Findings
1. Original falling update advanced horizontal position past the exact impact instant. A green boundary forecast could fail by ~0.07346 px at speed 32. Parent changed integration to solve impact time analytically.
2. Analytic integration still needs floating-point tolerance for inclusive platform boundaries (113 predicted, 112.99999999999925 actual).
3. The original renderer draws target top at y=312 while physics box bottom stops at y=322, visually embedding the box 10 px in its platform.
4. Original deadline check preceded impact processing, so an impact strictly before 40 s could lose if its enclosing physics tick ended after 40 s. Independent regression added.

## Passing initial independent checks
Forecast independently matches x + vx * sqrt(2*height/g) under the explicitly simplified zero-initial-vertical-speed release model. Safe center releases succeed; excessive horizontal speed fails. Deadline applies while falling. Pause and terminal states freeze. Releasing twice does not replace the falling body. Keyboard aliases retain independently held keys. Blur clears inputs and requires explicit resume. A frame gap over one second pauses rather than skipping simulation time.

An input-only policy (drive trolley toward target; release when predicted box fits with margin and speed <30) clears all three jobs, at approximately 7.05 / 7.01 / 8.97 simulated seconds. No state manipulation or target snapping is used in this policy. The generous 40 s jobs demonstrate the loop but do not establish deep sustained challenge.

## Browser status
Local Playwright/Chromium launch was attempted, but the default sandbox rejected a socket call. Escalated execution failed before browser launch with a bwrap read-only-filesystem setup error. No restricted path was read or modified. Thus no browser or canvas screenshot result is claimed here. The prepared visible-input browser script is `/tmp/harbor-browser-independent.cjs`; parent is handling actual cloud-browser verification separately.

## Interpretation
Release preserves horizontal velocity but resets vertical velocity to zero. This is a valid intentional simplification, not a physical crane simulation. Three fixed jobs and memorisable input sequences limit scope. Explicitly distinguish continuous trolley/load control from prior balance, convoy-steering and launch-and-watch experiments.

## Final independent re-check
All **11 independent tests pass** after the parent's fixes. Impact now uses the exact quadratic impact time, inclusive boundary comparisons have numerical tolerance, landing before the deadline takes precedence over a later enclosing tick boundary, and physical contact is at y=312. The independent hand-calculated oracle uses box center y=312−14=298 (neutral suspension center 185, fall height 113, duration sqrt(226/260)). A source-contract test confirms the drawn platform top is 312 and the successful box bottom also equals 312; this is source/engine verification, not screenshot inspection. Final input-only policy outcomes are 7.0136 / 6.9749 / 8.9347 simulated seconds. Original findings 1–4 are resolved. Browser coverage remains pending with parent, for the launch-environment reason above.
