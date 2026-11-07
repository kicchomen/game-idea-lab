# Independent review: Shadow Theater (2026-11-07)

Scope: source, engine/DOM-mock tests, generated design and cover visual inspection. No browser or physical-device pass is claimed. Builder was concurrently active; review describes the initial inspected revision.

## Blocking finding

667×375 landscape cannot fit the initial single-column flex minimum height. Header 44 + summary approximately 14 + title18 + stage minimum100 + message32 + three control rows132 + padding14 + seven gaps35 is approximately489px. Body overflow:hidden hides excess rather than making it usable. Add a short-landscape arrangement and verify all states and help in an actual browser. Parent notified immediately.

## Mechanics and tests

Added tests/shadow-theater-independent.test.cjs (3 independent tests). Combined run `node --test tests/shadow-theater*.test.cjs`: 21/21 pass. Independent matrix reconstruction confirms body/neck/head/tip transforms agree with rendered SVG hierarchy. All three targets are reachable using only 2-degree button steps. Starts and single-part corrections are not solutions. Terminal submit/nudge/undo are frozen, retries restore current level, undo does not refund attempts. Matching uses four geometric landmarks within seven SVG units, not pixel-exact silhouette overlap; describe it as approximate pose matching, not perfect image comparison.

Challenge is a real coupled three-angle alignment task, with immediate visual motion and limited judgment attempts. Fixed three poses give a short prototype, not evidence of 10-minute or hour-long replay depth. The three animals share the same kinematics; visual skins alone do not add independent mechanics.

## Input review

Native button focus is excluded from document shortcuts, avoiding double Enter activation. Global repeated Enter is ignored. Native held Enter on focused submit is not explicitly filtered and may produce multiple native clicks/consume attempts on browsers with key-repeat activation; browser-test this before claiming complete repeated-input safety. Rapid separate clicks intentionally spend remaining attempts, then terminal guard freezes.

pointerup/pointercancel/lostpointercapture, blur, visibility change all clear drag. Grouped drag history supports one-step undo. Existing mocked test exercises blur, not actual pointer cancellation/capture semantics. Actual touch/capture remains unverified.

## Size and modal review

258×568, 320×568, 360×640, 390×844 should accommodate minimum source layout, but this is not measured browser verification. 258 width leaves 240px content, around76px per part button, and narrow submit text may wrap depending on font. SVG preserveAspectRatio defaults prevent shape distortion. Full silhouette extent is not guaranteed by existing probe-bounds test: that test checks landmarks, not SVG paths or invisible 29-unit handle hit circles. Help has max-height and overflow:auto, allowing its own scroll, while background remains fixed; actual focus restoration, scroll reachability and all-state curtain fitting still require browser checks.

## Image/design comparison

Viewed design-original.png and cover.jpg. Both correctly present a dark articulated animal against warm parchment with a teal target, and theatrical framing. They are concept illustrations, not screenshots: design shows a tall crane with body/neck/head controls and ornate decoration; implementation is simpler SVG rabbit/bird/fox with body/face/ears-or-wing controls, plus undo/reset and three-attempt feedback. Cover implies more complex wings and articulated limbs than implemented. Explicitly label images as concept/design rather than actual play screen. design-notes.md was not yet present at inspection, so design adaptation record was not reviewed.

## Recommendation

Engine-level pass; conditional release only after landscape layout fix and honest browser status. Do not convert mock/static findings to smartphone/browser passes. Parent owns browser testing and final artifact checks.

## Final source re-review after builder update

The added landscape media query applies at 667×375 and uses two columns, retaining 44px controls. Minimum grid rows total248px, plus30px gaps and14px padding =292px (comfortably under375px). The stage spans rows2–7 and is approximately312px high. The original static minimum-height blocker is resolved by source inspection; actual rendered verification remains the parent's responsibility. Re-ran full matching suite:21/21 pass.

Read completed assets/shadow-theater/design-notes.md. It records selection comparisons, near-term feel, explicitly unverified 10-minute depth and unimplemented hour-scale concepts, four-landmark matching approximation, image versus implementation distinctions, and actual browser-test limitations. These address the concept/implementation honesty concerns. Its 18-test output is the builder's earlier suite; combined independent suite now has21.

Recommendation on native repeated Enter: add a narrow guard for repeated keydown Enter on focused submit, preventing the native repeat default while leaving the first native activation untouched. This is a usability safeguard for a limited-attempt confirmation action, consistent with the existing global shortcut repeat guard. It does not warrant a confirmation modal, broader input restriction, or changes to directional repeat behavior. Verify in a browser: first press consumes one attempt, held repeats consume none, release and fresh press consume one. Without this guard, do not claim all repeated confirmations are protected. No implementation files were edited by the reviewer.
