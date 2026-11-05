# Browser QA — Repair Workshop, 2026-11-05

Cloud Chromium: 320x568, 360x640, 390x844, 258x568 narrow embed and 667x375 landscape fit without document scrolling. Start/help dialogs fit. At320x568, cards end y317 and message starts y332. Final landscape action heights44px, document667x375.

Actual keyboard/Enter: first robot AB=2, repeated AB test keeps3remaining and one log, correct repair. Second AB=0,C=1,D=1 thenCD repair. Third AB=1,A=1,CD=1,C=0 thenAD repair. All3win,4spare tests. Same-job retry resets; EF wrong repair loses and revealsAB; same-job reset to4.

Cloud pointer input began timing out across Blogger and game tabs. Existing Mac Chrome normal-click check independently passed start,AB test=2,repeat test with no extra cost/log,correct repair,next robot,wrongAB repair on robot2(actualCD),same-job reset to1/3,4tests,unselected. Screenshots reviewed. No source changes on Mac.

Blogger:2images uploaded through normal UI and saved/reloaded CDN. Supplied article HTML readback exact match.320/360/390px preview no overflow/broken images;embedded start/select/test/fail/retry passed. Published10:46JST on2026-11-05,post2441288832916086624. Public page reload title,cover,list thumbnail,og:image,2body images,iframe and test operation passed.

Physical phone,Safari,human first-time play and long-term enjoyment not tested. Public-page checks were performed by browser executor; an additional parent feed fetch was not completed because exec-server disconnected. Do not label that extra read as passed.
