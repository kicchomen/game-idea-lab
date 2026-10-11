# Independent final review: 砂の下の博物館

Reviewed 2026-10-11 against the builder's frozen source and revised article.

## Verdict

PASS for independent source, controller, article, and artwork review. Mandatory production fixes: none found.

The complete local repository test suite passed: 176 / 176 tests. The fossil-specific subset passed 38 / 38, including seven new independent reviewer checks.

This report does **not** certify real-browser operation, deployed Pages assets, Blogger rendering, iframe loading, touch behavior, native button event synthesis, or published mobile layout. The parent is performing those separate operational checks. Controller tests here use a Node VM and a minimal DOM model, not a browser.

## Evidence and independent checks

Commands run successfully:

- `node --test tests/fossil-museum.test.cjs tests/fossil-controller.test.cjs tests/fossil-independent-review.test.cjs`
- `node --test tests/*.test.cjs`

The new independent test file is `tests/fossil-independent-review.test.cjs`. Detailed output is saved in `assets/fossil-museum/independent-test-results.txt` and `assets/fossil-museum/independent-full-suite-results.txt`.

1. **Random command/undo invariants:** 600 seeded runs, 80 attempted transitions each (48,000 total), covering valid/invalid/repeated digs, both tools, terminal actions, and undo. Checked exact pre-action restoration, action count, resource accounting, chip count, valid terminal state, all 36 clues, covered-cell output, and independently computed specimen borders after each transition.
2. **Collection geometry:** Computed every specimen border directly from coordinate distance rather than calling the production neighbor helper. For each required border cell, omitting that one cell prevented collection; revealing it enabled collection when the rest of the specimen and border were clear. Diagonal-only soil is excluded.
3. **Solvability without hidden-map guesses:** 300 varied routes across the three sites selected moves only from the current visible views. All won without chips. Remaining work was consistently 4, 2, and 0 for sites 1, 2, and 3.
4. **Rendered hidden information:** Inspected covered-cell titles, accessibility labels, and classes after reveals and undos across all sites. They remain generic and contain no hidden fossil identity, type, chip status, or collection state. Visible fossil continuations and specimen progress totals are intentionally provided clues. This is normal-UI information isolation, not a security claim against inspecting the client-side source.
5. **Keyboard and focus:** Checked tool changes while focused on each of the 36 cells, one roving tab stop, and rejection of held Enter, Space, arrows, 1, 2, and Z. Form controls retain their own shortcuts. Existing controller checks additionally cover native result-button handler fallthrough and page scrolling keys.
6. **Undo/retry/reset:** Checked failure-to-undo-to-retry, clean budget/chip/history restoration, site changes, and selected-tool reset. Existing tests cover success undo, next-site navigation, and last-site wrapping.
7. **Terminal precedence:** Independently produced a last extraction that also caused the third chip. It correctly failed despite both specimens being exposed/cleared. Undo restored the prior state exactly, and brushing the same final cell then won. Existing tests verify that success at exactly zero budget remains a win, while zero budget with unfinished collection fails.

One first-run reviewer assertion mistakenly expected the coordinate to appear twice in a covered-cell title. The actual title (`B1 まだ砂に覆われています`) was correct. The assertion was corrected; no production change was needed for it. Both final test runs are fully passing.

## Source assessment

- Three fixed 6×6 sites, two disjoint orthogonally connected specimens each, and one exposed starter fossil per specimen match the intended scope.
- Soil clues count all fossil cells in the eight adjacent positions, including exposed or chipped fossils, without edge wrapping.
- Brush costs 2 and does not chip; pick costs 1 and chips only fossils. Invalid, already-open, unaffordable, and terminal digs do not spend work or create history.
- At remaining work 1, the controller switches to the affordable pick and disables the brush. Work never drops below zero.
- Collection requires all fossil cells plus all orthogonally adjacent soil. Revealing fossil cells alone is insufficient.
- Three chips lose; otherwise collecting both specimens wins; otherwise zero remaining work loses. Terminal board/tool input is frozen, with undo/retry available.
- No gameplay network calls, persistent storage, external libraries, account actions, or unimplemented museum-building controls were found in the reviewed source.
- Responsive source uses six fractional grid columns, capped main width, border-box sizing, reduced-motion support, and keyboard/accessibility labels. Source inspection is not a substitute for browser layout verification.

## Final article and artwork assessment

PASS. The revised article incorporates the initial review's optional precision improvements: the white-line continuation clue, fixed 6×6 layouts, failure at zero remaining work before collection, and the need to focus the board for arrow navigation.

The opening establishes role, objective, limited work, and the fast-versus-safe tool choice. The article clearly separates the larger museum/exhibition idea from this excavation-only prototype and says those larger systems are not implemented. Instructions, tool costs, clues, collection borders, win/loss rules, keyboard keys, undo, and retry match the source.

Both delivered images were actually viewed at full resolution and at 320-pixel width. The title and all instructional headings/labels remain legible. The cover and concept art consistently show sandstone excavation, brush/pick choice, and fossil discovery. The illustrated board is schematic, and the article explicitly identifies generated concept imagery with a layout that differs from the playable version.

The article says beginner clarity and lasting enjoyment remain under evaluation, and explicitly disclaims teaching actual excavation methods. No overstated educational outcome, proven enjoyment, or user-test claim was found.

## Exact reviewed production snapshots (SHA-256)

- engine.js: `4d2f75459d4b689625623d8163916d86356a55c884190bc7e2c425750a739bca`
- app.js: `956829b0fdfd0d61e66cfe7a570025fac555675f348c72fd8a73d4bba227b28d`
- style.css: `9579e51dff152df12cfa26f864899484cb821f5a99175975098b15473edafa95`
- index.html: `f8532509db6e25ecef96d9c086b4a10f30387e4636e2561e4ab4cd256a410dbc`
- article.html: `cb6690112e45028e23b194d8527f6090501937cf408ef52ce79b28c5625e5c67`
- cover.jpg: `5764d7befb5ce6598dc84672a0bea718c0c6b11ba228575eaac5a46c7f940949`
- concept.jpg: `a6c12fcfc5833a845cccca42cb6e90d4fce5ec8586ab2ffbc8a1537163d7366f`

Only reviewer tests and review/result files were written. No article, production source, delivered images, or external state was edited by this reviewer.
