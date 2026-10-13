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

## 完了検査

- 記事本文コピーを320/360/390pxで検査。両CDN画像1440px読み込み、横溢れなし。埋込内幅266pxでも横溢れなし/返却成功
- Blogger412pxプレビューの埋込でA/B/C返却成功
- 公開2026-10-13T17:57:00+09:00。同じ投稿IDを維持、8公開2下書き。指定の旧2下書きは維持
- 実URL https://game-idea-lab.blogspot.com/2026/10/blog-post_13.html
- title「忘れ物窓口の探偵｜一人の証言が、三人をつなぐ」一致。トップ一覧サムネイルと記事内2枚を実表示、CDNnaturalWidth1440確認
- 公開Blogger全体を320/360/390pxのiframe viewportで検査。clientWidth/scrollWidthはいずれも305/345/375px（スクロールバー分を除く）で一致
- 公開記事埋込320pxでA/B/C成功、360px再挑戦後E/B/C失敗、390pxUndoしてA/B/C成功。繰返し操作と読める結果を確認
- 通常幅と狭幅で画像・文字・説明/リンク/試遊の順序を目視。キャプチャはその場で確認したが保存していない
- Pages記事検査追加commit47962a6、run38372429369成功。最終台帳commitの配信結果は最終報告で確認
