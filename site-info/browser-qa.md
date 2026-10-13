# Game blog readiness work — 2026-10-13

## Scope
Created three Blogger fixed pages and enabled the existing top PageList widget. No game code, existing article body, AdSense linkage, application, or account terms were changed.

## Before editing
- Fixed pages: 0, confirmed twice in Blogger.
- Compared the published operator/contact and privacy pages at cruiser-biyori.blogspot.com.
- Reused only the already-public handle, email and X contact. No real name, address or new personal detail.
- Google Analytics measurement ID blank in Blogger; comments require Google account; HTTPS redirect on; custom robots off.
- AdSense account Sites list contained 7 other domains, not game-idea-lab.blogspot.com; no linking submitted.

## Sources and content
- about.html, privacy.html and catalog.html are the submitted source HTML.
- Privacy explains Blogger/Google comments, GitHub Pages embedding and hosting requests, contemplated future advertising, contact handling and cookie choices.
- Catalog includes only 8 published Blogger games; the 2 prior unpublished draft articles are untouched.
- Source registry: repository README.md at ff0aad40734445ec5c1a92802b631ea047f4abcc and live article links.
- Catalog uses latest observed ?v=2 link for tiny-tug, hush-courier and sky-plates.

## Actual browser smoke tests
All 8 live articles, their embedded games and linked standalone pages loaded in cloud Chrome.
- tiny-tug: steering attached one ship, returned it to port, rescue 0→1/6; pause.
- night-market: tea inventory 0→1, basket 0→1/6, cash 12→11.
- firebreak-keeper: moved A from column2/row7 to column2/row5, actions 2→1; undo restores.
- hush-courier: movement and delivery 0→1/3; pause/resume; exposed courier reached suspicion100 and loss/retry.
- sky-plates: select plate1 and held Space, rotation83%→94%, applause0→1; time and other decay progressed, pause.
- fossil-museum: brush C1, work34→32, fish bone1→2/5 in embed and standalone.
- spark-shield: defense stamina4→3, sparks0→1, HP12 unchanged; counterattack enemyHP14→7.
- lost-property: inspect A revealed star, budget2→1; Ao=A/Ren=B/Mio=C return succeeded and next case appeared.
- Lazy-loaded frames appeared normally after scrolling into view.
- No blocking load/control issue in this test.
- Not every game was completed; no physical phone, novice-human or comprehensive accessibility test.

## Navigation
Existing PageList widget enabled and populated in order: home, playable catalog, operator/contact, privacy.
Widget update confirmation and overall layout save performed.
Read-only independent live-page/mobile QA follows in final publication metadata.

## Navigation correction during QA
Top PageList rendered on home and static pages but was absent from all 8 article DOMs. Added a standard HTML widget titled このサイトについて at sidebar_top with the four HTTPS links. No theme source was changed. Live readback is recorded in final metadata.

## Fixed-page QA
Independent live readback: 3 pages render prose, no raw HTML or duplicate content. Catalog exactly8 headings/16 matched destinations. Phone preview frame412px, usable397px, document scrollWidth397px; all3 pages no horizontal overflow. Overflow menu opens and page links work. Home http link redirects to https.

## Footer correction
The sidebar was offscreen on article pages without a visible opening control. Using standard Blogger layout drag, moved the same HTML1 widget into the footer above Attribution (no duplicate widget; no theme code change). Saved2026-10-13T09:39UTC. Final public/footer QA recorded in metadata.

## Maintaining this catalog
When a future game article is published, update the same Blogger catalog page (ID844576656208859196), catalog.html and publication metadata together. Include only published article entries; preserve the prior unpublished drafts. Recheck the article and trial URL before adding. This note does not change any scheduled job.

## Final footer readback
Live tiny-tug article footer: HTML1 parent #footer, x0 width703, one widget, four legible links; privacy click reaches correct public page. Lost-property article in Blogger smartphone preview: footer397px, no horizontal overflow, heading and all4 links visibly checked; operator/contact click reaches correct published page. No remaining QA blocker. This is simulated mobile layout, not physical hardware testing.
