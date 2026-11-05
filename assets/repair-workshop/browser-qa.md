# Browser QA — 2026-11-05

Cloud Chromium, five iframe viewports: 320×568, 360×640, 390×844, 258×568 (narrow embedded content), 667×375 landscape. Each initial/play/help view fits its viewport without document scrolling. Small viewport cards finish at y317, message starts y332 (no overlap). Help and result dialogs fit. Help touch target increased to44px; landscape action height increased to44px (final CSS recheck pending).

Actual keyboard/Enter UI operations in 320×568: AB test returns2; same test does not consume another attempt; correct repair advances. Second robot AB=0,C=1,D=1 then CD repair succeeds. Third AB=1,A=1,CD=1,C=0, then AD succeeds after4 tests. Final3-robot win displays4 spare tests. Same-job retry resets to4. EF replacement fails, discloses AB faults, same-job restart returns to4. Result dialog 292×365 within320×568.

Mouse click infrastructure currently times out Input.dispatchMouseEvent across Blogger and the local preview; keyboard operates. Earlier start/help clicks worked. Final pointer/touch flow and final CSS recheck remain pending. This is not a gameplay defect determination. Physical mobile devices, Safari, human first-time play and subjective enjoyment have not been tested.
