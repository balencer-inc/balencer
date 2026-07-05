# Vercel 公開用（Rainbow Voice 初回デッキ）

このフォルダは静的サイトとしてそのままデプロイできます。
- `index.html` … 初回デッキ（末尾ボタンは `plan.html` へ）
- `plan.html` … プラン
- `vercel.json` … cleanUrls 設定

## デプロイ方法（このリポジトリの実行環境はVercel APIが遮断されているため、手元/CI で実行）
1. Vercel CLI: このフォルダで `vercel deploy --prod`
2. もしくは Vercelダッシュボードで新規プロジェクト → GitHub連携 → Root Directory を
   `docs/proposals/rainbow-voice/web` に設定してデプロイ
