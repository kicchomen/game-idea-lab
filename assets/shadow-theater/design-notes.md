# 影絵の動物劇場 / Shadow Theater

## 選定と体験

プレイヤーは小さな影絵劇場の演者。体を回すと顔と耳も連なって動く。固定した見本のシルエットへ、自分の影を直接・連続的に重ねる。数字の正解や隠れた故障ではなく、画面で見える形そのものを読む。

候補として、庭の鳥の鳴き声を重ねる即興演奏、揺れる紙人形を支える曲芸、関節の影絵を比較した。音源や聞き分けに依存せず、「動かした瞬間に動物の表情が変わる」を小さく確かめられる影絵を採用。題材だけでなく、直接操形・親子関節・静かな観察を組み合わせた点を選定理由とした。

|比較|主動詞・操作対象|時間・フィードバック|勝利・再挑戦|
|---|---|---|---|
|本作|回す・連結された体/顔/耳（冠羽）|連続操作、即時に子関節も動く、輪郭を目視|3演目を各3判定以内で合わせる。現在の演目から再挑戦|
|前日ヨット|操船・移動する船|リアルタイムの風と速度|経由地を通り帰港、衝突/期限後再航行|
|修理工房|検査・部分集合|離散的に隠れた故障数を取得|情報を絞って交換、同じ仕事を再検討|
|陶芸|押す/引く・連続した表面|連続変形、輪郭の変化|形状を整える|
|荷積み|配置・独立した多角形|空間の占有と干渉|収容の成立|

本作は編集→再生ではなく、操作中ずっと影が変わる。陶芸の連続体変形とも、荷積みの独立物配置とも異なり、親子の角度が連動する。

## 時間ごとの魅力と限界

- 5〜10秒：丸い取っ手を動かすだけで、うさぎが顔を上げる。触感の即時性と、影に動物が現れる楽しさ。
- 10分：体を先に合わせると子関節の調整が楽になる。大きな姿勢と小さな耳の表情を分けて観察する学習。ただし固定3演目の本試作は数分向けで、10分の持続は未検証。
- 1時間の構想：左右の手で別の影を作って合成する、光源と距離で大きさを変える、二人で一つの生き物を演じる、即興の物語に観客が反応する。単なる見本追加でなく遊びの関係を変える案。いずれも未実装。

## 実装範囲とルール

3種の固定シルエット（うさぎ・鳥・きつね）、各3親子回転、初期姿勢と目標姿勢は固定。目標は青緑の点線、プレイヤーは濃紺。身体、顔の中心、耳/冠羽の先を含む4点の距離がすべて7 SVG単位以内なら成功。これは見える姿勢の近似判定で、画素単位の輪郭重なり率ではない。正解の角度数値はUIに表示しない。

回転角は体±45°、顔±55°、耳/冠羽±50°。ボタンとキーは2°ずつ、ドラッグは連続値。体が顔と耳を、顔が耳を動かす。ポーズ判定は各演目3回まで。失敗時に残り回数を消費、成功で次の演目。3演目で全体成功。失敗後は当該演目をやり直せる。全体成功後は最初から。時間制限なし。

Undoは姿勢のみ。判定回数を戻さない。ドラッグ1回はUndo1回にまとめる。履歴は100手まで。上限での無効な入力は履歴に追加しない。成功/失敗中の調整・判定・Undoは無効。開始前の操作も無効。ヘルプ中のキー操作、Ctrl/Alt/Metaショートカット、ネイティブボタンにフォーカス中のゲーム側キー処理は無効。判定キーの長押しは無視。ウィンドウのblur/非表示/ポインタ取消でドラッグを終了。

ネットワーク通信、外部アセット、外部依存、保存、音声、課金なし。生成画像は設計の参考で、ゲーム画面はSVGとCSSで描画。`engine.js`はDOMに依存しない、`ui.js`は描画と入力のみ。

## 画像を見た後の画面調整

2026-11-07、生成された縦長劇場案を実際に画像表示して確認。クリームの発光面、紺の影、青緑の目標線、黄土色の関節と操作を採用。豪華なカーテンと大きな見出しは狭い画面で遊びを圧迫するため採用せず、タイトル・演目・試行数・舞台・短いヒント・操作3段に整理した。生成案の鳥1体に対し、実装は3種の簡略シルエット。構想画を実ゲームのスクリーンショットとは扱わない。

## PDCA

Plan：関節の連動がすぐ理解でき、見える形に頼って調整する短い試作。
Do：直列3関節、ドラッグと2°ボタン、3演目、有限判定、Undo/Retryを実装。
Check：全初期姿勢が失敗すること、1部位だけ合わせても足りないこと、全3演目がボタンのみで達成可能なことを自動検証。角度を直接正解へコピーせず、可視4点の距離から座標降下する別の探索でも全3演目に到達。
Act：目標が塗り影に隠れないよう、点線を上に描く。親の姿勢から合わせる短いヒントを追加。ドラッグのUndoをジェスチャー単位にまとめた。生成案から青緑の輪郭へ配色変更。ボタンは44px以上、ヘルプは短い画面で内部スクロール。
Re-check：18自動テスト合格。ブラウザー実操作・実測・公開後確認は親担当の別記録。以下は視覚テストの代替ではない。

## ローカル実行とテスト

リポジトリルートで `python3 -m http.server 8765 --bind 0.0.0.0`。
`http://localhost:8765/games/shadow-theater/` を開く。ビルド不要。
`node --test tests/shadow-theater*.test.cjs`。

2026-11-07 自動テストの出力：

```
✔ UI can start, fail, retry and reset without terminal leakage
✔ UI solves all rounds through buttons and preserves feedback
✔ help blocks shortcut input and keyboard native activation avoids duplication
✔ pointer move changes pose immediately, cancel/blur clears drag, undo groups gesture
✔ ready guards all gameplay input
✔ all starts are nontrivial, target poses reachable using public 2-degree input
✔ visible geometry coordinate search independently reaches all three
✔ failure after exactly three wrong confirmations and frozen terminal
✔ reset retries current animal and restores all attempts
✔ undo changes only pose, not consumed attempts
✔ next requires clear and campaign ends after three
✔ invalid and nonfinite values cannot poison engine
✔ repeated directional inputs clamp without growing no-op history
✔ root articulation moves children and tip does not move body
✔ single correct part is not enough
✔ one degree errors tolerated but meaningful pose displacement rejected
✔ keyboard aliases, repeats, and native control focus are safe
✔ all allowed integer poses retain visible key geometry
ℹ tests 18
ℹ suites 0
ℹ pass 18
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 446.595877
```

## 未検証事項

物理スマホのタッチ、実機のブラウザバー変動、iOS/Safari等のクロスブラウザー、スクリーンリーダー、人の初見理解と面白さ、10分/1時間の持続は未検証。座標探索の成功は人が楽しく解ける証明ではない。マッチ判定は4点近似で、形の全ピクセル比較ではない。固定見本は暗記できる。画面内収まりは320×568、360×640、390×844、記事内258×568で開始・遊び・成功・失敗・再挑戦を実ブラウザーで別途検査する必要がある。

### 独立レビュー後の追加修正

短い横長667×375では縦積みの最低高さが画面を超える指摘を受け、幅450px以上・高さ500px以下の横長専用2列配置を追加した。舞台を左、演目/メッセージ/3段の44px操作を右へ配置。文字やボタンの縮小で隠さず構成を変える。実ブラウザーでの横長確認は別途必要。

### 最終入力・表記レビュー

ネイティブの「ポーズ！」ボタンにフォーカスしたままEnterを長押しすると、ブラウザーがクリックを反復して試行を使い切る可能性があるため、判定ボタン上のEnter/SpaceリピートをpreventDefaultで抑制。最初のネイティブクリックと矢印の連続調整は維持し、モック回帰テストを追加した。鳥の3番目の関節は翼でなく頭の冠羽を描いているため、演目名を「冠羽をゆらす夜の鳥」、操作名を「3 かんう」に修正。ヘルプで冠羽を頭の飾り羽と説明した。

最終再実行：`node --test tests/shadow-theater*.test.cjs` は22/22成功（自作19＋独立3）。duration_ms 181.149756、fail/cancelled/skipped/todo はすべて0。
