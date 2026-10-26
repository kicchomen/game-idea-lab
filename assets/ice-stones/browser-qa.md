# Browser QA — 2026-10-26

## Actual browser, not simulation
Cloud Chromium controlled through supported cua UI/Playwright methods. No application-state injection, no forced wins. Existing shared browser tab10 scheduled video untouched. New game/editor/QA tabs used.

- Baseline source main bbdb190230eb913def9e44863b5ffaf4c9272909, Pages40254932326 success.
- Three actual rounds won by ordinary angle/power buttons and 3 committed throws: 0°/65 ends blue15.1 orange35.0; −10°/65 ends blue3.2 orange39.7; +10°/65 ends blue18.3 orange23.9. Physics not modified for these routes.
- Actual viewport revealed that clicking lower Throw controls hid the target. Fixed by scrolling canvas into view only after a successful shot, and result overlay into view on terminal state. Regression added; source2bce5e7d26eb86fd323c57aef10677e2262ad802, Pages40255227258 success. Versioned script avoids stale browser cache. Saved Blogger phone preview and narrow article mirror visibly show target and travelling stone after throw.
- 320px ordinary iframe: actual three-shot success, score15.1 vs35.0. clientWidth=scrollWidth305 (15px desktop scrollbar). Buttons44px high.
- 360px iframe: actual default0°/50 three-shot failure, blue102.1 vs35.0; pause/resume and retry. clientWidth=scrollWidth345.
- 390px iframe: retry, keyboard ArrowUp increases50→55; Enter launches one shot. clientWidth=scrollWidth375. Visible buttons44px high.
- Saved Blogger article preview: actual smartphone layout, both CDN images decode (1439×810,520×990), embedded3-shot success. Header remains sticky; normal vertical scrolling is used. No horizontal clipping observed.
- Saved article HTML read back after reload exactly matches local article.html, including2CDNimages,1iframe and directplay link. File picker had no selected file and no inserted image; ordinary compose clipboard image insertion then succeeded via Blogger's own hosting flow. No hidden upload API or cookie/security change.
- Exact saved-body mirror in real iframe at320/360/390: no article/game horizontal overflow; both images load; power50→55 and reset55→50 work at each width. Nested game content widths256/296/326 due article margins and desktop scrollbars. Evidence article-responsive.json. Actual320px mirror also completed3shot success on final versioned scroll script.
- Very narrow256px game could shrink plus/minus below44px width; minimum44px added without changing physics. Final recheck recorded in publication record.

## Boundaries
DevTools opening displayed organization restriction; dismissed and respected, no security setting change or DevTools workaround. Exact-width tests use ordinary HTML test fixtures, not DevTools. Saved-body mirror does not include whole Blogger theme. Official Blogger smartphone preview is tested separately. Public article verification follows publication. No physical phone, real multitouch, novice human, screenreader, cross-browser or sustained-enjoyment test. Fixed layouts have memorisable solutions. No claim of full curling simulation or AI opponent.

## Public article completed
Published post2010469529437619004 at2026-10-26T10:48:00+09:00 (minute precision). Exact canonical https://game-idea-lab.blogspot.com/2026/10/blog-post_26.html . Title, OG cover, both loadedCDNimages and final2iframe verified. Real public embed3shot success15.1vs35.0 and actual directplaylink click passed. Official inventory21published,2preservedold drafts,0scheduled; one newpost only.

The complete actual public Blogger article (not a mirror) was then loaded in ordinary width-controlled iframe tests/ice-stones-public-qa.html. At320/360/390px frame widths, root client=scroll305/345/375; body widths273/313/343, and game client=scroll256/296/326. Bothimages loaded and power50→55→reset50 worked at every width. See public-responsive.json. This closes the earlier full-theme pending note; still desktop browser emulation, not physical phone. Final style at256contentwidth has minimum44×44px buttons, no horizontal overflow (final-responsive.json). Final code d82f7d760e0375146fdb439a20ee0a18fdbc07a5 passed Pages40255886710 and full614tests. Public proof screenshot is public-proof.jpg.
