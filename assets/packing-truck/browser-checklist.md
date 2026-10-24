# Browser checks still required
Target: https://kicchomen.github.io/game-idea-lab/games/packing-truck/?v=090e0bc
Deployment source exactmatch verified for four files; Pages run40048259459 succeeded.

1. Open standalone. Start, select parcel2, try overlap at row1col1 after parcel1 placement; rejected without loss. Select parcel1 again, remove, re-place. Rotate parcel3 and confirm dimensions/status. Keyboard activate a gridcell and ensure focus retained.
2. Complete routes from qa-routes.json (zero-based x/y, parcelid). No state injection. Each new board starts playing automatically on Next. Final win→もう一周.
3. Start, pause, verify90-second clock not changing; resume. Blur pauses. Retry resets sameboard. Startidle90seconds for actual naturalfailure, thenretry.
4. Repeat actualplacements at320/360/390CSSpx, record root/iframe width, overflow, touchcell size and screenshot. These are desktop narrowviewport tests, not physicalphone.
5. Capture actualgameplay screenshot for article image. No generated UI image.
6. Direct Blogger posts/drafts check: avoid duplicate Packing Truck, preserve Sensor Shift and Footstep Echo drafts. Tiny Tug alreadypublished.
7. Normal Blogger compose image upload for coverandgameplay, verify CDN URLs aftersave/reload. Shortarticle; iframeheight mayneedadjust basedrealmeasurements. Test savedarticle320/360/390, embeddedplacementandpause, links.
8. Prepublication screenshot → Library → root posts to user, thenpublish withoutnewapproval. Inspect actualpublic URL/title/canonical/thumb/images/iframe; recordpostID/JSTtime. Commit exactfinalarticle/assets/QA/publication/README,verifyremote/Pages.
