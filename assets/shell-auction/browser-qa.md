# Browser QA — 2026-10-27
Cloud Chrome desktop, actual UI input (not simulated). Not physical smartphone or first-time human testing.
- Initial seed shiosai-1027, bids 3,5,0,7,7,0: completed 21 points, 2 coins, 4 shells. Actual keyboard arrows for first bid; buttons thereafter.
- Same-market retry resets 24 coins/empty collection. Six passes completed failure at 0 points/24 coins. New-market button changes market number and opening shell.
- Ordinary HTML iframe fixture widths 256/320/360/390: actual +/- operation, no horizontal overflow (client/scroll widths 241/305/345/375 after scrollbar). Buttons >=46 px tall. Narrow screenshot visually checked. These are CSS viewport tests, not device emulation.
- Rapid repeated action within 400ms is deliberately ignored, preserving one auction; tests do not claim each rapid click takes effect.
- Found incorrect pair forecast after acquiring first shell; fixed to show only during bid phase, added 2 regressions. Redeployment and cache-busting app URL required before final approval.
- Actual gameplay JPEG stored through Blogger Compose clipboard image insert, verified blogger.googleusercontent.com CDN.
- Full repository automated tests: 684 passed, 0 failed. Independent review and seeded reachability simulations separately documented.
