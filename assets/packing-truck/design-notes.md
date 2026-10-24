# 引越しトラックの積み係 / Packing Truck — 2026-10-24

## Preflight
Read the full 366-line current README at main 5af3d13915f197f21dccf55bc2d0f7c313a7d9d5, the 20 game directories, recent publication ledgers, Shepherd Circle design/QA, and site-info publication ledger. The site-info ledger is stale for newer games; per-game records include October23 Shepherd Circle. Blogger direct draft/published checks are pending UI access and are required before article creation/publication. Sensor Shift and Footstep Echo drafts are not publication targets. Tiny Tug is existing published content.

## Player role and structure
Become the person packing a moving truck. All parcels are visible; select, rotate and place a rectangular footprint, then move an earlier parcel when its remaining gap blocks another. Feedback is immediate fit/collision, with no edit-parameter/playback phase or hidden correct answer. The role makes spatial responsibility concrete: an apparently harmless placement changes which gaps remain.

Compare existing structures: Shepherd Circle indirectly guides autonomous animals; Roadside Bargain adjusts numeric offers and receives acceptance; Meadow Camera times a framing decision; Pottery Workshop deforms connected bands; Pocket Forest grows terrain for adjacency/habitat scores. This game instead packs non-overlapping rigid shapes in finite space. It remains a one-screen spatial puzzle, but not a renamed edit→run puzzle. Earlier puzzle-heavy games were considered explicitly, while recent prototypes span timing, physical control, negotiation and herding.

First 5–10 seconds hypothesis: rotating a long parcel and seeing it fit gives readable cause/effect. Ten-minute hypothesis: compare packing orders and rescue awkward gaps by rearranging, rather than merely replay a memorized layout. Hour-scale concept: delivery order could make reachable unloading paths matter; fragile and weight constraints could create competing packing goals; multiple destinations could make what is accessible more important than filling every cell. None of these systems is implemented. Current three fixed jobs are only a core trial, not an hour-long game.

## Implemented rules
Three boards:4×4 with14occupied cells,6×4 with23,6×5 with29. All pieces are rectangles, freely rotated90degrees and rearranged. A tap specifies the chosen parcel's top-left corner. Collision/out-of-bounds placement is rejected without modifying state. The selected existing parcel is excluded from collision checks so it can be moved. A return button removes it. No penalty other than time for mistakes; no gravity, stacking, weight, physics, delivery order or real moving-work advice.

Each board has90active seconds. Start begins that board; filling every parcel wins instantly; timeout fails. Pause freezes time, background/blur pauses, frame gaps over2seconds pause rather than silently catching up. Retry resets the current board; success advances, final success starts a new run. All buttons are semantic native buttons. Tab and Enter/Space operate the game. Pointer hover previews the chosen footprint; on touch, the selected dimensions and small shape preview remain available. No external packages, fonts, requests, storage, accounts or analytics in gameplay.

## PDCA and independent review
Plan: a distinct direct spatial manipulation trial with all information available and no hidden puzzle answer.
Do: implement three near-full boards, rotation, replacement, removal, active-time deadline, retry and explicit pause.
Check: independent reviewer found lost keyboard focus after board re-render. All three boards were independently solved and bounds/pause/repeated-placement behavior checked. The reviewer correctly noted jobs1and3 can be solved by list-order/top-left placement with one rotation and no rearrangement. Larger is not necessarily harder.
Act: restore focused cell after success/rejection, focus next-job button after a win, announce rotated dimensions, add selected-piece shape and pointer footprint preview. Keep difficulty claims modest rather than pretending three boards prove deep challenge. A future human test should observe whether players ever need to rearrange and whether that recovery is understandable.

## Evidence and limits
8 new production-engine tests pass; entire existing suite522pass,0fail. Stored deterministic routes solve all three, and independent source/engine review confirms them. These are not real browser results. Local Chromium default startup failed with socket Operation not permitted; requested approved test escalation failed at sandbox setup with a read-only mount error before browser execution. No protected paths were read or security settings changed. Actual browser UI/320/360/390 testing is pending the shared cloud-browser slot. Do not publish article before completing those checks.

Physical phone, screen reader, novice-human comprehension, cross-browser and long-term enjoyment remain untested. Six-column touch cells may be smaller than44px at narrow widths; verify visual/operational usability in the real browser and document measurements. The game intentionally omits drag-and-drop so a small-screen tap can use a clear top-left reference instead of finger-obscured dragging.
