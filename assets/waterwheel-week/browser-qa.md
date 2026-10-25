# Browser QA — 2026-10-25

Implemented by the prototype worker; independently reviewed and played by the publishing worker. This is agent-operated desktop Chromium testing, not human first-impression or physical-phone testing.

## Verified
- Fresh Blogger preflight: 21 posts, 19 published and 2 drafts. Packing Truck latest; no Waterwheel duplicate. Sensor Shift and Footstep Echo left unchanged.
- 320 CSS px game viewport: seven days played through actual card/commit/next controls, success at 21 bread. Success retry restored day 1 and initial stocks.
- 360 CSS px: seven supplies choices produced failure at 0 bread; failure message and retry available.
- 390 CSS px: schedule expanded/collapsed, Space selected a card, Enter committed it, restart cancellation preserved state and restored focus.
- PC 1050 CSS px: card/forecast/commit/day transition operated. Standalone screenshot captured from actual page.
- Repeated/fast operations: UI mutation debounce prevented immediate next-day double activation; model/controller tests verify stale revision and repeated-key protection.
- Independent review added visible future offers, restored cancel focus, and fixed result-heading scrolling. Final app revision uses instant scrolling and same-origin ancestor alignment only; cross-origin boundaries are not crossed.
- Official saved Blogger preview: both CDN images loaded with natural widths 1439 and 1165, title and complete article present, embedded game selected/committed first day. Result heading and next-day control visible after commit.
- Official Blogger standard smartphone preview visually inspected (approximately 381 rendered CSS px); no screenshot/cover clipping observed.
- Exact saved body mirror: normalized visible text, img/iframe/link attributes equal the authored body. Normal iframe test pages render that saved body at 320/360/390 CSS px. Body client/scroll widths respectively 305/305,345/345,375/375 (15px scrollbar). No horizontal overflow. Native card/confirm/day transitions were executed inside the nested game at all three widths. Result and next-day controls readable; screenshots saved.
- Article uses 720px embedded height plus standalone link, avoiding the previous excessively tall embed.
- All 577 repository tests pass after the final scroll fix; tests include exhaustive legal-week enumeration and independent production checks.

## Important distinctions and limits
- Exact 320/360/390 saved-body tests use an HTML mirror, not the entire live Blogger theme. Full official theme checked at desktop and standard Blogger smartphone preview.
- Chromium DevTools is prohibited by organization policy. It was not used or bypassed; normal page/iframe controls performed the responsive tests.
- No physical mobile device, human first-time player, long-term fun, accessibility assistive technology, or educational-effect validation was performed.
- 139 of 1864 legal full-week sequences win; maximum 27 bread. This is simulation coverage, not a claim about human difficulty.
- Final publication/public URL and ledger checks are recorded separately after publishing.
