# Independent review — 2026-11-13

Scope: source, shared production engine, independently written Node tests, generated design reference and corrected cover image. No browser or physical-device operation was performed by this reviewer.

## Findings and disposition

1. Invalid direction names inherited from Object.prototype (`toString`, `constructor`, `__proto__`) passed the engine guard and threw. Fixed by author with hasOwnProperty guard; independent regression passes. Ordinary UI never supplies these values, so this was a defensive API issue, not an observed browser crash.
2. Bug turning rule was absent from help although the current direction was drawn. Author added: bug follows its arrow and searches clockwise when blocked. Verified in source.
3. Initial generated cover had a trail endpoint dangling in grass, inconsistent with a line starting on safe land. Parent regenerated/edited it to connect that endpoint to the left stone boundary and removed an unrelated dotted trail behind the beetle. Corrected image visually inspected. It remains conceptual artwork, not a literal gameplay screenshot or exact board state.
4. UI concept has 0/24 with existing flowers and a disconnected gardener/trail. The implemented target is 36. Use it solely as a design reference; do not label it actual gameplay. Use an actual final gameplay screenshot for article mechanics.
5. Original LCG low two bits repeated a short cycle. Author changed sampling to higher bits; independent tests use xorshift with separate diverse trajectories.

## Independent tests

`node --test tests/star-garden*.test.cjs` passes 16 tests (11 author, 5 independent).
- 10,000 random games / 28,798 closures: a separately implemented union-find connected-component oracle exactly matches the production flood-fill captured region.
- 472 random games won and 9,528 lost, with 20,009 contacts. This is deliberately unguided random input, not a player difficulty estimate.
- At each transition: immutable input, monotonically increasing safe area, correct area count, bug remains outside safe region, contiguous unique open trail, player on trail end or safe cell, bounded step/life changes.
- Reject crossing own earlier trail without consuming a turn.
- Third contact fails and terminal actions do nothing; a fresh game resets state.
- Reaching target on step 80 counts as success, not timeout.
- Reject inherited property names and missing direction values.

## Game judgement

The mechanic creates territory by committing a vulnerable path and closing it. This is structurally different from existing single-parameter replay puzzles and parcel switching. A 12-move exact winning route exists with all lives intact. Because the layout and bug movement are fixed, memorization quickly reduces challenge. Present this honestly as a small area-capture experiment; do not claim sustained depth or novice-user validation. Optional future layouts, bugs and objectives are a concept, not implemented scope.

No remaining source/engine blocker found for prototype staging. Actual keyboard/pointer, success/failure/retry, article embed and 320/360/390 px checks remain the publisher's required gate before article publication. Physical smartphone, human first-look and long-term enjoyment remain unverified.
