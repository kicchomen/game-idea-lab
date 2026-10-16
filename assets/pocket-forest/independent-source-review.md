# つながる小さな森 独立ソースレビュー

2026-10-16。対象：pocket-forest/{engine.js,app.js,index.html,style.css,tests.js,design-notes.md} と assets/pocket-forest/article-template.html。

## 最終判定

**条件付きコードレビューPASS。** ルールとゲーム説明は整合。発見した連打による誤配置・配置後/undo後フォーカス消失は親の修正を確認し、追加回帰もPASS。下記の公開前条件と実ブラウザ未検査を残す。これは完成版の実機検証PASSではない。

## 指摘と修正確認

1. 配置後の連続clickで次手も即確定する問題をNode DOMスタブで再現。親がplacementArmedを導入し、毎手の明示セル選択まで確定を無効化。配置ボタン/Enter双方の拒否と矢印・クリックによる再選択を検査してPASS。
2. 配置後およびundo後の盤面DOM再生成でフォーカスを失う問題を報告。親が選択セルfocusを復帰し、復帰だけでは再配置を許可しないことを確認。Enter repeat抑止もPASS。
3. 主操作 .place-button の標準サイズを指摘。幅100%、最小高さ48px、focus-visibleが追加された。ルール/説明の12px化も確認。
4. 288px幅で最小グリッドが内幅をわずかに超える計算上の懸念を報告。300px以下で外側余白縮小・gap 2pxが追加され、盤面幅不足は計算上解消。

## 実施検査

- node pocket-forest/tests.js：PASS。成功10点4種、未達0点0種、終了後配置拒否、終局undoを含む。
- node review/independent-extra-tests.js：PASS。100 seed・計1,200配置で予告と実配置の一致、元state非破壊、完全なundo復元、全手undo→retry一致、終了ロック、斜め・行跨ぎ非隣接を検査。
- node review/independent-interaction-tests.js：PASS。実際のapp.jsをNode簡易DOMスタブで初期化。連打、Enter repeat、毎手再選択、配置/undo後focus、retry、成功/失敗12手ルート、結果表示、終了ロック、最終手undoを検査。
- app.js / engine.js の構文チェック：PASS。
- 4すみか・3地形・12手終了時10点以上かつ3種以上、現在盤面得点、森合流/池拡大での失点、同じタネの候補再現は実装と説明で一致。
- ゲームから外部への通信コード/外部依存は確認されなかった。通常の正規state操作で未処理例外は追加テスト中に発生しなかった。

## 公開前の条件

- 記事テンプレートには画像 COVER_CDN_PENDING / CONCEPT_CDN_PENDING と検証記録未反映が残る。実URLと確認済みの検証内容へ置換する。
- 記事の「TabとEnter」に加え、「1/2で地形、矢印で空きマスを選びEnterで確定」を明記し、配置/undo後は毎手セルを選び直す仕様を操作説明・design-notesへ反映する。
- 親が配信後に実ブラウザ・モバイル幅で再検査する。

## 未実施と保証しない範囲

実ブラウザ/実スマホ操作、描画、ネイティブタップ/キーイベント/フォーカス、スクロール、支援技術は未検査。Node DOMスタブはこれらの代替ではない。CSS検査はソースと幅計算のみ。画像自体は今回の独立レビュー対象外（親から修正・目視済みの報告を受領）。公開URL・画像CDNの疎通は未検査。長期的な面白さ、生態の正確性、教育効果は保証しない。記事が架空の生態ルールと実装/構想を区別している点は適切。
