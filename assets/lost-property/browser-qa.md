# ブラウザ検証 2026-10-13

Cloud Chromeの実DOM操作。スマートフォン実機/人の初見テストではない。

- Pages prototype8962cff、QA0e742d1の配信成功をGitHub Actionsで確認
- 通常幅703px、document幅とscrollWidth703で横溢れなし
- 案件1 A/B/C成功、Undo後Mio E誤答、再挑戦で初期化
- 案件2 E/B調査、C/E/A返却成功
- 案件3 B/C/E調査、D/B/E返却成功、最終案件に次ボタンなし
- 別検査者による320/360/390px実操作の詳細はbrowser-independent-review.md
- Blogger同じ投稿ID8001755356304616392で作成画面のクリップボード画像アップロード。両画像がblogger.googleusercontent.comとなりnaturalWidth1440、cover810/concept960を確認
- HTML保存後再読込し本文全18行、画像2枚と試遊iframe、単独リンクを照合
- Bloggerスマホプレビュー412pxで先頭画像/タイトル/導入文を目視、本文/埋込の残検査を継続

当初の画像ピッカーは必要Cookie画面から進まなかった。通常の画像クリップボード貼付けで保存できた。
