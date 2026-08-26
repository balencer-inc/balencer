# MUTSUBI PORTAL（統合社内ポータル開発）

社内業務・情報・予約・各種管理機能を一元化する統合社内ポータル。現在 Phase 0（要件定義・技術設計）。

## モック公開URL
https://mutsubi-portal-mock.vercel.app （Vercel・production）

- 社名が入るため `noindex, nofollow, noarchive` メタと `robots.txt` の Disallow で検索避けをしている
- 管理者画面はログイン画面の「管理者専用ログイン」タブ → `admin123`（モックの固定値）
- 更新するとき: `mock-portal.html` を `index.html` としてコピーし、noindexメタを足した独立フォルダを作って `npx vercel deploy --prod --yes`。リポジトリ丸ごとはデプロイしない

## 正本はNotion
- 親ページ（エンジニア共有の入口）: https://app.notion.com/p/balencer/MUTSUBI-PORTAL-144ca8f9e04f412ab84310834a50f256
- 元資料「ポータルアプリ要件定義」: https://app.notion.com/p/balencer/3c753269fc5e8071affdfa7cf9f70642

構成は 親ページ（現在地・3つの図・資料・次のアクション）／01 開発依頼書（正本）／02〜10 詳細DB。

## このフォルダの中身
| ファイル | 用途 |
|---|---|
| `mock-portal.html` | UIプロトタイプ（バイト等価の原本。Notionにはzipで添付済み） |
| `MUTSUBI_PORTAL_要件定義書ver1_差異と注意点.docx` | 現行HTMLと要件定義書ver1の差異メモ（Notion親ページに添付済み） |
| `assets/*.mmd` | 全体像・システム構成・開発フェーズのMermaidソース |
| `assets/*.png` | 上記を描画したPNG（Notionに貼付済み） |

## 図を作り直すとき
```bash
cd assets
npx -y @mermaid-js/mermaid-cli@11 -i diagram1-system-overview.mmd -o diagram1-system-overview.png -b white -s 3 -c mermaid-theme.json
```
描画後、Notion親ページの該当画像を差し替える。

## 注意
- 現行HTMLは画面イメージ確認用のモック。localStorage・固定値・ダミーデータで動いており本番実装ではない
- NotionへのHTML直アップロードはCloudflare側で弾かれる。zipに固めてアップロードする
