# Live cloud Chrome QA — 2026-10-15

Production Pages commit 89611efdbf2789307204ef5f35f746f3e887c3b5: Actions38664198624 succeeded. Remote main and all four deployed game source files matched. All346 Node tests pass, including45 salvage tests and14 independent engine tests.

Actual CUA clicks: first expedition won with21/14 banked,5 oxygen and2 dives; retry; three empty dives caused natural quota failure; retry restored22 oxygen,0 bank,0 dives. Repeated expeditions, movement and recovery remained operable. This is browser interaction, distinct from deterministic engine tests.

Blogger saved HTML was reloaded and compared exactly with source. Both generated illustrations were visually reviewed and uploaded using ordinary compose clipboard image insertion; CDN natural sizes1200x800 and900x1350 verified. Preview embedded game accepted dive, movement and recovery. A2px iframe border overflow was found and fixed with inline box-sizing:border-box, then reloaded before publication.

The responsive-check.html article-content harness used320/360/390px frames. Native scrollbar consumes15px: article content measured305/345/375px, embedded game303/343/373px. At every width, loaded images stayed within width, scrollWidth equalled clientWidth, visible buttons were at least44px high, and actual dive→move→recover clicks worked. Browser-width-results.json contains measurements. Screenshot was visually inspected at390px. This is a fixed-width article-content harness, not physical-device or full Blogger-theme viewport emulation. Blogger mobile preview was separately checked at365px content width.

Published article: https://game-idea-lab.blogspot.com/2026/10/blog-post_15.html
Published2026-10-15T10:21:57.495+09:00; post313407064244169801. Public title, first-image thumbnail in feed, two loaded CDN images, standalone link and iframe verified. Live article content width733px equals scrollWidth733px after fix. Embedded dive→move→recover passed again after publication. Ten published posts, two old drafts unchanged.

Limits: no physical-phone, novice-human comprehension, sustained enjoyment or independent live-browser claim. The independent browser runner was not completed; see independent-review.md. No real-diving or educational-effect claim.
