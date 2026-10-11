# Independent initial review: 砂の下の博物館

Reviewed on 2026-10-11. Scope: article source, actual cover/concept image pixels, isolated images resampled to 320 CSS-pixel-equivalent width, and newly available game source. No browser or external edits were used. The article was not edited.

## Verdict

PASS for the requested article/art review. Mandatory corrections: none.

This is not a certification of the published Blogger layout, iframe loading, or interactive gameplay. Those were outside this browser-free review. The image readability verdict is based on actual 320-pixel-wide inspection; article layout is a source-level check.

## Checks

- Top-down idea and scope: PASS. The opening gives the role, limited-work constraint, and fast-versus-safe choice. The next sections explain the loop, separate the future museum concept from the current excavation-only prototype, and provide tap/keyboard controls and the objective.
- Exact implemented scope: PASS. The source defines a 6×6 board, three fixed sites, and two connected specimens per site, each with one exposed starting fossil cell. All six specimen shapes are orthogonally connected. The article promises three sites and two specimens per attempt; it does not claim procedural levels, museum construction, exhibition management, saving, or multiplayer.
- Rules: PASS. Soil clues count fossil cells in all eight surrounding positions, including already exposed fossil cells. Pick costs 1 and chips a fossil; brush costs 2 without chipping. Collection requires the entire specimen plus all orthogonally adjacent soil. Three chips fail; two collected specimens succeed; unfinished work at zero budget fails. Undo and retry are present. Article claims match these rules.
- Instructions: PASS. Tap selection and tools, costs, damage threshold, collection rule, win condition, retry/undo, and PC keys are stated. The in-game expandable help adds the exact white-line continuation clue, already-exposed-cell counting, diagonal-border exclusion, and absence of a real-time countdown.
- Cover: PASS. The Japanese title is correct and legible at 320 px width. Brush, pick, ammonite, excavation setting, and warm sandstone palette support the actual core activity. It does not depict an implemented museum-building screen.
- Concept image: PASS. The headings 手がかりを読む / 道具を選ぶ / 化石をつなぐ and labels 速く掘る / そっと払う are correct and remain readable at 320 px width. Brush and pick are visually distinct. It communicates discovery, tool choice, and connected fossil forms. Small notebook details are decorative, not necessary instructions.
- Image consistency: PASS. Both images share warm sandstone excavation imagery. The concept grid and specimen shapes are schematic rather than literal game screenshots. The article explicitly discloses generated concept illustrations and says the cell arrangement differs from the playable version, adequately limiting the claim.
- Mobile article source: PASS with host-layout limitation. Both images use width:100% and height:auto; the container uses max-width and overflow-wrap; the iframe is width:100%. No fixed-width article content creates an obvious horizontal overflow. The published theme's inherited paragraph font, real 320 px layout, and iframe height/scrolling still need browser verification.
- Claims of fun or educational effect: PASS. The article explicitly says beginner clarity and sustained enjoyment are still being evaluated and disclaims teaching real excavation procedure. No effectiveness, proven-fun, educational-outcome, or user-study claims were found.

## Optional precision improvements

These are not publication blockers:

1. Make the key visual clue explicit in the article: 「白い線がマスの端まで伸びている方向に、化石の続きがあります。」 This would connect the main gameplay explanation more directly to what first-time players see.
2. Tighten the scope sentence to 「6×6マスの固定配置を、3つの発掘地で試せます。」 The current statement is truthful but less specific.
3. If changing the failure sentence, 「標本を回収し終える前に作業量が0になると失敗」 is more exact than 「作業量が足りなくなると失敗」. In the implementation, a remaining budget of 1 disables the brush but still permits the pick; zero budget is the actual exhaustion trigger.

## Reviewed files

- article.html
- cover.jpg (1400×788)
- concept.jpg (1086×1448)
- games/fossil-museum/engine.js, app.js, index.html, style.css

Image derivatives used only for inspection were written under /tmp. No deliverable images were modified.
