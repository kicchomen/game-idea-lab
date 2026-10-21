# Independent QA — 野原のシャッターチャンス

Reviewer: independent review task, 2026-10-21 UTC.
Production preview: https://kicchomen.github.io/game-idea-lab/games/meadow-camera/?v=20261021-2

## Fixes identified independently and resolved
- Full-body photo mismatch: bird wing could exceed top crop. Frame top moved to 60; crop height 222.
- Grass partial occlusion incorrectly passed. Visible horizontal extent now checked against grass range.
- Space while a non-shutter button focused performed that button rather than shot. Explicit Space shutter behavior added.
- Fixed-size album caused anisotropic stretching. Photo canvas now retains crop proportions.
- 250 ms frame gap / blur auto-pause blocked cloud browser input. Replaced with capped timestep and hidden-document pause. Versioned assets confirmed in live DOM.

## Verified so far
- 25 local automated checks independently rerun: 17 engine + 8 mocked-controller checks passed. These are not browser or human playtests.
- Desktop live Chromium input: start, left/right buttons, pointer aiming, Space shutter, zoom, pause/resume.
- Desktop live success for missions 1 and 2; score carried 1 to 2.
- Six bad shots on mission 3: terminal failure, disabled controls, precise reason, retry returns mission 3 with 50 seconds / 6 shots / prior score 2.
- Burst click cooldown prevented duplicate shots.
- Space on zoom-focused button fired a shot without toggling zoom.
- Album image no longer stretched in screenshot.
- Responsive start screen at 320/360/390 CSS px: independent screenshot review, no overlap; DOM body scrollWidth equals clientWidth at each size; buttons 44–46 px tall.
- Cover image checked: one fox, one rabbit, one blue bird, camera photographer; landscape illustration, no broken text.

## Pending
- Desktop mission 3 success and final restart.
- Actual browser controls within each narrow CSS width.
- Timeout is automated-only; real-device mobile and first-time human enjoyment remain untested.

## Completion update — 01:40 UTC
- Desktop all three missions completed through actual browser controls, final total 3/6; final restart resets to mission 1, 50 seconds, 6 shots, score 0.
- At 320, 360, and 390 CSS px, actual start + seven left-button inputs + shutter produced success (score 1, film 5) in each embedded game. Actual retry reset each to 50 seconds / 6 shots / score 0.
- Successful mobile-width screenshots reviewed: controls, result message, retry buttons, album fit without overlap. At 320 px retry text wraps but stays within its button.
- Article HTML template reviewed: top-down concept, landscape illustration explicitly labeled not gameplay, screenshot, embedded playable, controls, standalone URL, implemented scope versus future ideas, and honest no-real-device/no-human-playtest caveat all present. COVER_CDN and SCREEN_CDN remain intentional placeholders and must be replaced/verified before publication.
- No remaining release-blocking defect found in prototype scope tested.
- Untested: real mobile touch hardware, first-time human play, real-browser timeout (covered by engine/controller tests), final Blogger saved article rendering and CDN images (publisher handles).
- Screenshot files: assets/meadow-camera/independent-gameplay-full.jpg, independent-mobile-success.jpg, independent-final-success.jpg.

## Saved Blogger preview review — 01:55 UTC
- Saved draft 8996931272622090612 examined without editing or publishing.
- Both article images loaded from Blogger CDN; natural sizes 1439×810 and 1165×892.
- Embedded game loaded and responded to start, movement, shutter, failure, timeout and retry via real browser input inside article.
- Browser's built-in mobile preview is 412 CSS px, not the requested 320/360/390.
- DevTools UI was explicitly unavailable by organization policy. No workaround to open DevTools was attempted.
- Ordinary native window resize and browser zoom 200% achieved exact window.innerWidth 320 and 390. Both article widths tested with readable controls and intact images.
- Target 360 was measured 359 after resize snapping. 359 is tested, but exact 360 is not claimed; publisher informed and can finish exact measurement.
- Minor iframe border overflow: iframe 282.5 vs article content 280.5 at 320 width. No clipped controls, but recommend box-sizing:border-box. Publisher preparing fix; reread pending.

## Saved preview correction verified — 01:59 UTC
- Fresh preview generated from editor: iframe now has box-sizing:border-box. Measured article content 319.5 px and iframe 319.5 px; previous 2 px overflow resolved.
- Article embedded timeout was also observed in real browser ('日が暮れました'), followed by successful retry and fresh shot.
- Exact 360 CSS px check remains pending. Native frontmost tab changed to a separate marine-blog task while reviewer was resizing, so background measurements were stale. Parent asked to coordinate exclusive native operation; reviewer stopped further native input.

## Final article QA completed — 02:03 UTC
- Exclusive native operation coordinated; ordinary Chrome zoom 175% and window resizing achieved exact window.innerWidth=360 (devicePixelRatio=1.75). This is browser CSS-width verification, not a physical mobile device.
- Fresh saved preview at 360: article content, both CDN images, and iframe each measured 319.4286 CSS px. Both images loaded. No iframe border overflow remains.
- Actual embedded start → left button → shutter worked at 360, film reduced 6→5 and concrete failure feedback displayed. Screenshot reviewed and stored as assets/meadow-camera/independent-article-360.jpg.
- Article checks at requested 320/360/390 CSS viewport widths now completed. Prior 359 limitation is resolved, not silently relabeled.
- No release-blocking defect remains in reviewed saved draft. Publication/post-publication canonical URL verification is publisher responsibility.
- Native control released to parent and publisher.
