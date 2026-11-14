# 岩壁のふたつの手 / Two Hand Climb
2026-11-14 local prototype. No publication performed by implementation worker.

## Core
小さな固定壁で、手をひとつずつ掛け替える。残した手が届く範囲を決め、握力を消費する。中央棚で両手を揃え、休憩を使って頂上へ登る。時間は手を掛け替えた時だけ進む。現実の登山・安全技術を再現した教材ではない。

## Rules
5列×7段、突起は中央3列に配置（中列の一部に穴）。最下段の左/右手から開始。残した手との縦距離1以下かつマンハッタン距離3以下へ掛け替えられる。既に持つ突起は選べない。通常2、距離3なら3の握力を消費。初期握力8。中央4段目に両手を置くと、一度だけ休憩して8に回復。両手が最上段にあれば成功。握力不足、または握力0かつ休憩も成功もできない状態で落下する。時間圧力なし。再挑戦で完全初期化。

## Distinct experience / scope
前日の星庭の囲い番は軌跡で領域を囲う遊び。本作は2つの支点の掛け替えと消費資源。屋根わたりはジャンプ/ダッシュのリアルタイム入力、綱渡りは連続バランスであり、本作には動的な振り・重力・脚・ロープ・物理演算はない。
最初の数秒は手を替えると選べる突起が変わる感触。10分の構想は休憩までの消費を逆算する複数経路、1時間の構想は突起の種類や異なる壁・装備選択。ただし今回の実装は固定1壁・1棚のみ。最短経路は8掛替＋休憩、覚えれば容易。長期の奥行きや初見の人の面白さを保証しない。

## Controls and layout
クリック/タップで手、続いて明るい突起。L/Rで手選択、Tab/Enter/Spaceでも操作可。ボタン最小44px、5列7段の各行44px、320/360/390×600を意識した縦構成。実ブラウザでのスクロール/操作検査はまだ行っていない。物理スマホ・別ブラウザ・初見の人も未検証。

## PDCA
初案は縦2段まで届き、4掛替で休憩せず登頂可能だった。純エンジンの幅優先探索で発見したため縦1段までに変更。8掛替＋休憩で成功する経路を確認。握力0でも棚なら休め、頂上なら成功とする順序をテスト。握力3を使う横への大きな手替えもあり、すべての明るい突起が成功経路ではない。

## Tests
`node --test tests/two-hand-climb.test.cjs`
10 tests: success, zero-energy shelf, missed-rest failure, one-time rest, invalid/occupied targets, support-dependent reach, long reach cost, immutability, terminal and reset, exhaustive reachable-state invariants. These are Node production-engine checks, NOT live browser or human tests.

## Browser test route (row numbered from TOP)
Start at row7 col2 (left) / col4 (right).
1 left -> row6 col3 (cell27)
2 right -> row5 col2 (21)
3 left -> row4 col2 (16)
4 right -> row4 col3 (17)
5 press 棚で休む (8 energy)
6 left -> row3 col2 (11)
7 right -> row2 col2 (6)
8 left -> row1 col2 (1)
9 right -> row1 col3 (2): success, energy0, 8 moves.
Failure: same first four moves, skip rest and move left to row3 col2.
Retry: 再挑戦, both hands bottom, energy8, rest unused.

## Image note
Parent supplied a reference path whose actual image was a boat illustration, not the climb cover. This mismatch was reported, image not embedded or copied. UI uses the requested warm rock / blue-and-red hands / green shelf palette, independently constructed CSS.

## Pending
Independent review, live browser action + responsive checks, generated cover verification, Blogger/Pages deployment verification. Implementation worker performed no external saving/publishing.

独立レビューで消費2/3が読み上げのみと判明したため、到達可能突起へ可視数字を追加。棚/頂上ラベルも保持。独立側は全到達726状態/53,724遷移の不変条件を確認。
