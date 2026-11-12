# Parcel Switch UI design reference

Created 2026-11-12 before UI implementation. Generated using the built-in image_gen tool (not API fallback). Reference only, not an actual gameplay screenshot.

## Image

- `design-concept.png` (1024 × 1536): inspected visually after generation and a targeted correction.
- Generated first pass with 12 parcels and circle/triangle/square, then corrected to implementation symbols red star / blue circle / gold triangle, 18 parcels, two binary switches, pause and restart.
- Corrected image preserves the intended two-junction routing topology and one-screen hierarchy.

## Inspection and implementation guidance

Use warm cream background and navy belts/outlines; compact title and score row; central incoming belt branching first to red star, then second junction branching to blue circle / gold triangle. Two prominent switch controls below the diagram, then pause/retry. Maintain all controls in viewport; mobile implementation must simplify proportions rather than reproduce reference pixels.

Known reference deviations to correct in implementation: blue-circle bin body is teal in the generated art; use consistent blue for the destination. Both arrows are visible in each reference switch; actual UI must clearly and exclusively highlight the selected direction. Generated score is sample state 4 / 18, not evidence of a real test.

## Initial prompt

Use case: ui-mockup. Asset type: design reference BEFORE implementation for a mobile browser game, portrait aspect ratio 2:3. Create a polished flat 2D UI screenshot concept, not a phone frame. Game: Japanese postal conveyor junction operator. Parcels with coral circle, teal triangle, or mustard square destination symbols arrive down a central belt. Two branching switches guide the moving parcels into three destination bins. Warm cream canvas, navy typography and conveyor belts, coral/teal/mustard destination accents, tactile rounded buttons, subtle paper workshop aesthetic. Screen hierarchy: compact title top “こづつみ分岐便”, small status row “お届け 4 / 12” and “ミス 0 / 3”; large central branching conveyor diagram using almost two thirds of screen height; three clearly visible destination bins marked ●, ▲, ■; lower two large switch controls labeled “分岐 1” and “分岐 2”, each showing directional arrows. Footer compact text “分岐を切り替えて、同じ印の箱へ”. Minimal text, very legible, generous touch targets. All controls and statuses fit one screen. Clear flat front-on graphic diagram rather than realistic machinery; use deliberate spacing, simple geometry. No characters, no decorative text, no extra panels, no scrolling, no outside margins around the UI.

## Targeted correction prompt

Preserve composition, conveyor paths, cream/navy postal workshop aesthetic and two-junction topology. Change delivery count to 4 / 18. Left destination parcel/bin symbols become coral red ★; middle blue ●; right gold ▲. Top parcels blue circle, red star, gold triangle. Preserve ミス 0 / 3. Lower group 分岐 1 is one large toggle ★ ← / →; 分岐 2 one large toggle ● ← / ▲ →. Replace footer with 一時停止 and やり直す. All content on one screen.

## Article cover

`cover.jpg`, 1280 × 720, 234,046 bytes. Generated with built-in image_gen; original raster 1672 × 941 reduced proportionally and JPEG compressed for Blogger. Visually inspected original and final JPEG: exact Japanese title/subtitle, 1 entry, 2 junctions, red-star / blue-circle / gold-triangle destination bins consistent. This is an illustrated concept, not gameplay evidence. Caption should identify it as a concept illustration.

Prompt: Wide 16:9 Japanese editorial game concept illustration, not screenshot or controls. Title “小包の分岐番”, subtitle “通したら、次の小包へ。” Warm cream/navy postal workshop illustration. One incoming conveyor splits at junction 1 to left red-star bin or onward right to junction 2; junction 2 splits left to blue-circle bin or right gold-triangle bin. Exactly three destinations and two junctions. Cardboard parcels carry destination symbols consistently. Clear navy paths, paper texture, restrained shadows, readable title, no characters, extra controls, extra paths or watermarks.
