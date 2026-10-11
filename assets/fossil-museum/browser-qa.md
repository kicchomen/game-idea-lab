# Browser verification — 2026-10-11

## What was actually exercised

Cloud desktop Chromium, using visible page controls. These are actual browser interactions, not mocked controller or simulation results. Narrow layouts were tested using native window resizing and normal 200% browser zoom, reading innerWidth and DOM widths after resizing. This is responsive desktop testing, not physical-phone or mobile-Safari evidence. DevTools was blocked by the organization; the block was respected and no settings were changed.

- Live Pages commit 1b6e194db9b89e2ed8ec7357b211e628bfa77198; Pages run 38112545361 completed successfully before playtests
- Site 1 success: both specimens recovered, zero chips, four work remaining
- From the success screen, undo restored five work and an unfinished border cell; excavating D6 again restored success
- Retry reset all specimens/work/chips; using the pick on B2, D2 and C1 produced the three-chip failure screen
- Retry after failure worked
- Enter excavated focused B2, Z undid that excavation
- Site selector changed to site 2 with work 32 and reset correctly when returning to site 1
- Standalone at 320, 360 and 390 CSS px: six columns visible, no document horizontal overflow; brush excavation of B2 and Undo worked
- Saved Blogger preview at 320, 360 and 390 CSS px: both CDN images loaded, text stayed within layout, nested game excavation and Undo worked
- Reloaded Blogger editor's complete source matched the local 2251-character article.html exactly before publication

## Public result

Article: https://game-idea-lab.blogspot.com/2026/10/blog-post_11.html

Trial: https://kicchomen.github.io/game-idea-lab/games/fossil-museum/

Post ID: 6004115168095843624

Public time element: 2026-10-11T13:59:00+09:00

- Title tag: 砂の下の博物館｜速く掘る？ そっと払う？
- Canonical URL matches the public URL above
- Open Graph thumbnail uses the uploaded cover image with Blogger's w1200-h630 derivative
- Cover loads at natural width 1400 and concept image at 1086; both complete after scrolling through the article
- Public embedded game is served from the verified Pages URL; visible excavation and Undo operated successfully
- Public responsive measurements: innerWidth 320 / document clientWidth=scrollWidth 312; 360 / 352; 390 / 382
- Public embedded game at the narrowest article width: clientWidth=scrollWidth 280, all columns and controls remain usable
- Public 320/360/390-width screenshots are saved as cropped JPEG evidence, excluding browser/account chrome
- Blogger list after publication: six published, two preserved drafts. Sensor Shift and Footstep Echo were not published

## Separate automated evidence

176 full-suite tests pass. Independent reviewer added seven assertions and exercised 48,000 random action/undo transitions plus 300 visible-information-only winning routes. See independent-review.md and test result files. These simulations are not novice-human evidence.

## Remaining scope limitations

No physical phone, Safari, novice-human test, accessibility assistive-technology session or long-term retention test. There are three fixed 6×6 sites; museum construction, exhibits, persistence and broader campaign progression remain conceptual. The illustrations are explicitly labeled concept art and are not exact maps of the trial. No fun or educational benefit is guaranteed.
