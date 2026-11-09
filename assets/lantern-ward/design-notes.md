# 夜森の灯り番 / Lantern Ward

## 役割から始めた企画
夜の森の道を守る灯り番になる。灯りを置き、影が鈍り、光が届き、結界に近づく前に消える様子を見守りながら、次の投資を決める。主動詞は「設置する・強化する・進行中に備える」。一つのパラメータを編集して結果だけ再生する試作ではない。

候補比較: 雨雲を動かす気象管制（連続誘導）、灯り番（配置と進行中の資源投資）、市場の香り調合（配合推論）。今回は資源を空間に固定する決断と、敵が来ている最中も続く判断を選ぶ。

直近作品との比較:
- Star Scoop: 袋から1個引く/持ち帰る、離散ターン、確率と未確定得点。今作は台座への持続的投資、実時間、到達前の撃退。
- Shadow Theater: 輪郭の部位を回して見本へ合わせる。今作は敵の移動、範囲、攻撃と減速の組合せ。
- Windward Sail: 船を直接連続操舵する。今作はプレイヤー本体を動かさず、設備配置が自律作用する。
- Repair Workshop: 履歴から故障を特定する。今作は正解配置の当てものではなく、消費と収入で戦線を育てる。

5〜10秒: 陽灯の線が影を捉え、月灯で移動速度が落ちる。灯りの範囲と台座番号を即表示。
10分: 同じ初期資源で配置や投資順を比較する。ただし固定1道・5波の試作であり、配置を覚えれば深さは減る。初見の人による楽しさは未検証。
1時間の構想: 複数の出口、季節ごとの光の相互作用、守る樹の選択による異なる資源体系。単なる波数追加ではなく、守る対象や設備の組合せが変わる方向。未実装。

## 実装範囲と数値
固定1本の折返し道、台座6、5波で合計32体。初期結界5、灯の実75。5体に抜けられると失敗、5波終了時に結界が残れば成功。初期の灯りは置かれていない。設置・強化は準備中と波の最中にできる。停止中は不可。

陽灯25: 半径82、毎秒13ダメージ、範囲内で最も進んだ生存影1体を攻撃。30でLv2: 半径94、毎秒24。
月灯25: 半径76、範囲内全体の移動速度を48%へ、毎秒0.15の微弱ダメージ。30でLv2: 半径90、毎秒0.3。減速は重複しない。主な価値は足止めであり、単独で敵を倒す用途ではない。
撃退1体につき灯の実3。第1〜4波突破で18。最後の波には次の準備資金は付かない。移動・撤去・売却なし。

通常影の基本HP45/速度35、速い影35/58、重い影140/25。HPは波ごとに基本値の1、1.3、1.6、1.9、2.2倍。出現間隔1.65秒。パスは[0,42]→[302,42]→[302,132]→[58,132]→[58,222]→[360,222]。固定歩幅で内部計算し、外部dtを1/60秒以下に分割する。フレーム時間を捨てず、隠れた画面やフォーカス喪失時は明示的に停止する。

## 画面と画像
深い青緑、琥珀の陽灯、淡い青の月灯、マゼンタの影。生成した実背景forest.pngをforest.webpへ軽量化し、ボードの背景として実利用。パス・敵・灯り・UIは実行時描画で、生成画像に判定を依存しない。背景は構想画像/素材であり、完成実画面の証拠ではない。

上下スクロールを前提にしない可変高さの単画面。6台座ボタン、3購入操作、次波/停止/再挑戦の主要操作は常時下部へ配置し、各ボタンは44px以上。詳細ヘルプだけ別ダイアログをスクロール可能にする。320/360/390px幅での実表示は親担当のブラウザQAで検証し、幅と高さ・単独/記事内を分けて記録する。制作時点では物理スマホは未検証。

## PDCA
Plan: 移動速度を下げる灯りと単体攻撃を組合せる小さなタワーディフェンス。5波を自分で迎え、準備する時間を確保する。
Do: 初期HP25/19/68、月灯毎秒1.2で試作。
Check: 初期の陽灯3台でも月灯3台でも、追加投資なしで全波・無傷の勝利となり、資源投資の意味が薄かった。自動テストの探索で検出。
Act: HPを45/35/140にし、後半波ほど増加。月灯のダメージを0.15へ下げて減速役に分離。
Re-check: 無設置と月灯3台は第1波失敗。陽灯3台固定、陽灯2+月灯1固定も最終波で失敗。陽灯2+月灯1から強化と追加設置をする方針は全32体を撃退し無傷で勝利。これは選んだ比較方針の結果であり、唯一解や最適性の主張ではない。

さらに、描画フレームのdt上限で経過時間が失われないよう削除し、長フレームと細分化ステップの一致を確認。キー長押しによる連続購入と、ダイアログを閉じた際の意図しない再開を防いだ。

## 検証
`node --test tests/lantern-ward*.test.cjs`: 純エンジン16+モックコントローラ5 = 21成功。資源、不正入力、範囲、停止、後半強化、敗北、勝利、再挑戦、キー反復、画面離脱を含む。モックは視覚/実ブラウザ/実機検査ではない。全リポジトリテストと独立レビュー、実表示結果は確定後別記録。

次の人による試遊で見ること: 月灯を弱い攻撃塔と誤解しないか、強化時に範囲が増すことが読み取れるか、波の途中の追加設置が忙しすぎないか。現試作には敵編成プレビューの詳細、音、無限モード、セーブ、ランダム道はない。

## Independent follow-up review
Exhaustive 233 affordable initial layouts found one no-investment success (sun 1,5,6; one life left). Thus investment is helpful, not mathematically mandatory. Article wording corrected before publication. +18 rewards only intermediate waves 1–4.

## Actual browser QA
Cloud Chrome, not physical phone: completed five waves with5/5 lives; bare setup lost at first wave; clean restart, keyboard2/M placing moon, pause/resume, repeated actions verified. Game frames320×568,360×640,390×700,320×480: build/start/pause/retry worked, minimum44px buttons, no horizontal overflow. Saved-article HTML fixture at320/360/390 included margins+scrollbar, actual game widths273/313/343; same controls worked and both CDN images loaded. These fixture tests are not the Blogger theme. Official Blogger phone preview412px separately verified article+embedded width365px, both CDN images loaded, start/build/pause worked. Human first-time test and physical phones untested.
Independent source reviewer fixed short-screen clipped-control risk. Full repo1028 tests passed.
