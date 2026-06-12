# BALENCER Outreach — 営業メール自動化システム

バレンサーのサービスを中堅・中小企業に届ける半自動メール配信ツール。

- **Phase 1 計画書**: `~/.claude/plans/url-notion-url-curried-wolf.md`
- **セットアップガイド**: [SETUP.md](./SETUP.md)
- **メール文面のサンプル**: [`/demo-outreach/`](../../demo-outreach/) (静的モックアップ)

## 開発

```bash
cp .env.example .env.local  # APIキーを貼る
npm install
npm run dev                  # http://localhost:3100
```

## アーキテクチャ

```
[キャンペーン作成]
    ↓
①リサーチ層 (Baseconnect + WebSearch + Firecrawl + Claude Agent SDK)
    ↓
②候補レビュー層 (阿部承認)
    ↓
③生成層 (採用テンプレ × HP分析 → 下書き with hook_evidence)
    ↓
④下書きレビュー層 (フック根拠ハイライト・リンク挿入・承認)
    ↓
⑤送信層 (Resend、60-120秒間隔、特電法フッタ・配信停止リンク自動付与)
    ↓
⑥追跡層 (Resend Webhook + 自前ピクセル + パイプライン管理)
```

## 厳守ルール

- **完全自動配信はしない** — 阿部さん承認が必須
- **フック1文には引用元URLと引用文を必ず持たせる** — `hook_evidence` 無しは承認不可
- **テンプレ全文の使い回しUIは作らない** — 核を壊すため
- **公表メアドのみ送信対象** — 個人名アドレスは初回除外
- **送信前に必ず `unsubscribes` 突合** — 特電法対応

## 配置

`balencer/apps/outreach/` 独立Next.jsアプリ。
コーポレートサイト本体 (`/src/app/`) には依存せず、デザイントークン (`/docs/design-system/tokens.css`) のみ参照。
