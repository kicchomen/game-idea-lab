# Browser QA — 2026-11-04

Verified unchanged game bytes through supported internal Sites preview, Chromium.

- 320×568, 360×640, 390×844, embedded 258×568, landscape 667×375: document width/height equals viewport; all visible ready-state buttons inside viewport, minimum 44×44 CSS pixels. Landscape and narrow embedded layouts visually checked.
- All five sizes: opened/closed help, started, paused, and reset through real DOM controls; paused overlay visible.
- PC standalone: start, held Right, W width, Space shutter while pause button focused, pause/resume, help, natural failure, retry verified. Space did not activate pause.
- Natural 36-second failure reached 0 points after poor input and four overheats; final retry control visible.
- Successful uninterrupted browser play: 77 points, 1.5 seconds spill, zero overheats. Used normal pointer clicks and shutter controls guided by visible actor DOM rectangles and cue text; no game state injection, timer changes, or engine calls. Retry returned to first cue and reset score/heat.
- 30 Node tests pass. Independent static/controller review passes separately.

Limits: browser emulation, not physical smartphone or human first-play testing. Enlarged text and untested unusual viewport sizes not certified. Article/Blogger public rendering and GitHub Pages delivery checked separately after deployment.
