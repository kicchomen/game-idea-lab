# Actual cloud Chromium QA 2026-10-23

Prototype commit9041f7f6d2121b0fbd6a776ddf214eec11d66e80, Pages39882611141success. Earlier071f4e9 also deployed successfully (39882147998). Fixture revision4d6b622267493e9e91e18128913143bd9f161599, Pages39883028916success.

PC direct browser UI (not engine simulation): v2 script references verified in DOM. Three canvas clicks behind flock led to4/4success45.0sec. Success retry restores briefing,70sec,0/4. Natural no-input70sec timeout showed0/4failure, then retry/start restored state. Actual browser screenshot saved browser-success.png. Gameplay.png is an actual current UI crop, not concept art.

First live320px test exposed excessive time dilation at low frame rate caused by0.1s frame cap. Repaired to fixed120Hz catchup through2s frames, long gaps explicitly pause. Unchanged production physics; new1fps and long-gap regressions. Final514repository tests passed independently. Source/mock tests do not substitute browser verification.

Responsive normal iframe320px: DOM clientWidth=scrollWidth=320. Start and pointer destination work. Pause works and stays explicit.360/390 and completion pending. Fixture is normal hosted HTML, no debug controls or hidden-state mutation. This is desktop responsive testing, not physical mobile touch.

Blogger article/CDN/saved readback/public checks pending. Do not claim publication or complete QA yet.

## Additional actual browser operations, 2026-10-23 01:26–01:29 UTC
320 CSS px: pointer destination, pause/resume, natural timeout at 0 seconds, retry restored 70 seconds and 0/4. 360 CSS px: start, ArrowRight, Wait, timed progression and pause. DOM clientWidth=scrollWidth=360. 390 CSS px: resume, direction button, reset restored 70 seconds and 0/4. DOM clientWidth=scrollWidth=390. Previously 320 clientWidth=scrollWidth=320. All controls fit; screenshots can be a frame stale immediately after action, so semantic state readback used for final transitions. Physical mobile devices are not tested.
Blogger normal native upload successfully stored cover.jpg and gameplay.jpg at blogger.googleusercontent.com. Saved article body reloaded and preview shows both images, article and embedded game. Article width/embedded operation verification remains before publish.
Independent article/image reviewer requested iframe border-box; added to source and saved Blogger HTML to prevent 2px content-box overflow.

## Final publication checks
2026-10-23 01:34–01:36 UTC: saved article HTML fixture at320/360/390 CSS px had matching clientWidth/scrollWidth; both CDN images decoded at natural widths1439/570, and iframe fit304/344/374px. At each article width, embedded start/Wait/reset returned70sec0/4. Actual Blogger smartphone preview body365px had scrollWidth365 after border-box repair; embedded start/pause worked. Published once at10:35 JST, post4260675058226376697, public URL https://game-idea-lab.blogspot.com/2026/10/blog-post_23.html. Public title/datetime, both decodedCDNimages,coverOG and embedded start/pause verified. Blogger20total18published2olderdrafts0scheduled. Exactassetscommit b606a54a57b50395348f24653a180128fdb1e413 Pages run39884564324success. No physicaldevice/humanfun claim.
