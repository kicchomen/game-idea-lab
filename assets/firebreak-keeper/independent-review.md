# Independent review — 2026-10-08

Initial findings: (1) rescue then let every tree burn wins missions 2/3 without using water or firebreaks; (2) mode controls overwrite terminal result explanation; (3) narrow result panel may overflow; (4) retreat message is overwritten. Fixed with maximum eight burned forest tiles, terminal controls disabled and guarded, scrollable small-width result panel, and retained retreat message. Reviewer independently reran 29 engine tests: PASS. Random 2,187-turn forecast check agreed with actual spread. Article wording “no time limit” clarified to unlimited thinking time but mission turn limit. No other material article/game mismatch found.

Final verification: full repository 87 tests pass (33 new, including four mocked controller tests). Live browser success, failure, undo, retry, next mission and narrow layouts were tested separately; see publication.json. Mock tests are not physical-device tests or evidence of fun.
