# Browser and publication QA — 2026-11-01

- Baseline Git main e36fb5013a794f7329ca864ee734b7a7a1da9270 and Blogger directly reconciled: 26 published, 2 protected drafts, no scheduled posts/new duplicate. After publication:27 published,2 drafts.
- Independent engine review found/fixed impact substep error, inclusive boundary floating error, deadline-event ordering and 10px ground mismatch. Article consistency review corrected “cannot control” to “cannot change box motion” to preserve pause semantics.
- All 833 Node tests pass (18 new). Deterministic policy simulations complete 3 jobs in ~7–9 seconds; not human fun testing.
- Actual cloud Chromium foreground UI: right arrow hold, pause/resume, first-job success, next job, wrong-position failure, retry, left-button hold. Background tabs correctly pause; no safety behavior removed.
- Gameplay frames320/360/390px: exact no-overflow widths,52px main buttons, actual start/release/fail/retry/start/pause each width. No injected game state.
- Blogger images each pasted once into compose UI, then read back normal blogger.googleusercontent.com CDN URLs and dimensions1440x810 /1165x747. Saved HTML reloaded and compared.
- Saved article body rendered in320/360/390px frames: content widths281/321/351 with equal scrollWidth, both images loaded and fitted, embedded game fitted. Start/pause worked at all widths. Screenshot inspected for text wrapping and controls. This is saved-body fixture, not exact-width full-theme browser emulation.
- Actual Blogger preview desktop and smartphone ~381px visually inspected. Public article title, date, first cover, two CDN images, OG image, standalone link and embedded game start/pause verified at https://game-idea-lab.blogspot.com/2026/11/blog-post.html .
- Physical smartphone, first-time-human comprehension and sustained fun remain unverified and are disclosed in article. Fixed jobs and generous timer are prototype limitations.
