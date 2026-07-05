# deploy/ — Vercel 自動デプロイ用サイト

阿部さんが「これデプロイして」と言ったら、Claude はこのフォルダに HTML を置いて
コミット＆プッシュする。Vercel の Git 連携が **push を検知して自動でビルド・公開** する。

## 構成
```
deploy/
├─ index.html            … トップ（各案件へのリンク）
├─ vercel.json           … cleanUrls
├─ rainbow-voice/        … 金丸様
│   ├─ index.html  (初回デッキ)
│   └─ plan.html   (プラン)
└─ clavis-partners/      … 杉山様
    ├─ index.html  (初回デッキ)
    └─ plan.html   (プラン)
```
公開URL例：`https://<プロジェクト>.vercel.app/rainbow-voice/` , `/rainbow-voice/plan`

## 【最初の1回だけ】Vercelと接続（阿部さんの作業・クリックのみ）
Claudeの実行環境からはVercel APIが遮断されているため、接続はダッシュボードで行う。
1. https://vercel.com/new → GitHubの `balencer-inc/balencer` を Import
2. **Root Directory** を `deploy` に設定
3. Framework Preset は「Other」（静的サイト）
4. Deploy を押す
5. 完了後、Project Settings → Git → **Production Branch** を
   `claude/zealous-darwin-ntnfwl` に変更（この作業ブランチを本番にする）

→ 以降は Claude が push するたびに自動デプロイされる。

## 【毎回】新しい資料を足す / 更新する（Claudeの作業）
- 新規案件：`deploy/<会社名>/index.html`（＋`plan.html`）を追加し、`deploy/index.html` にリンクを足す
- 既存更新：該当HTMLを上書き
- どちらも `git commit && git push` で自動反映
