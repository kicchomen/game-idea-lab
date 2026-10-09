# Browser verification — 2026-10-09

Environment: actual cloud desktop Chromium, ordinary window resize and browser zoom. Not a physical phone or first-time human playtest. Browser developer tools were not used.

## Core play
- Published production engine: 3 homes delivered in 21.5 simulated seconds through actual Shift+Right and Space keyboard input, including pause/resume before final delivery. Win screen observed.
- Continuous running produced actual discovery failure. Retry restored 0/3 and 55 seconds.
- At 320 CSS px, held on-screen Run button advanced to the first cottage; releasing it and resuming stationary delivered 1/3. Actual mouse long-press in desktop browser, not physical touch.
- Blogger preview embedded game also moved to the first cottage and delivered 1/3 with keyboard input, pause/resume.
- Standalone 320/360/390 CSS px had equal document clientWidth/scrollWidth. 320px control targets measured about70.6×66px; all four remain in one row. Meter-row suspected intrinsic-width overflow did not reproduce.

## Article
- PC and 320/360/390 CSS px article documents had equal clientWidth/scrollWidth. Both images loaded at naturalWidth1400 and fit the article column.
- Image-first concept explanation precedes one iframe and the standalone play link.
- Blogger normal HTML insertion converted two base64 images to Blogger CDN HTTPS URLs. Saved full source was copied through normal editor UI after reload and matched exactly; no data URIs remained.
- Existing initial five posts were checked: 3 public (Tiny Tug2467816573351864872, NightMarket2227938574447171811, Firebreak1517983666088192901) and2 drafts (SensorShift6862408650449844535, FootstepEcho1057707127785703864). Neither older draft was edited/published.

## Defect and retest
- A 320px Blogger article leaves game iframe288px. Paused card200.59px exceeded stage190.77px and clipped vertically. This was missed by engine tests.
- Fix: 240px minimum stage below360px, vertically centered unchanged-ratio canvas, max-height and overflow-y protection for cards.
- After loading version2, actual288px embed measured stage240px; ready card169.19px and paused card200.59px fit; clientWidth=scrollWidth=288. Source CSS v2 was confirmed in DOM.
- Cached unversioned iframe HTML initially retained the old CSS. Updated both saved article play links to ?v=2, regenerated preview via Blogger Preview button, and verified readback and the versioned stylesheet before retesting.

## Limits
Cross-browser Safari, physical mobile multi-touch, novice comprehension, accessibility with assistive technology, and sustained enjoyment are unverified.

Final version2 retest: actual288px Blogger embed reached all3 deliveries in21.5s, discovery failure and retry. Ready/failure card169.19px, pause200.59px and win151.59px fit240px stage. Article widths320/360/390 and embed widths288/328/358 all had equal client/scroll widths. Public article title, two images, top thumbnail and embedded start/pause verified. Published time from public time[datetime]:2026-10-09T11:16:00+09:00.
