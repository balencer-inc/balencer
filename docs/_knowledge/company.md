# 会社・プロダクト背景（共通前提）

## 株式会社バレンサー（BALENCER, Inc.）
- 中小企業向けに「経営をAIで」支援。代表: 田部（tabe@balencer.jp）。
- サイト: https://balencer.jp（Next.js 16 / React 19 / Tailwind 4 / microCMS / Vercel）

## プロダクト / LP
| 名称 | 内容 | 公開URL | リポジトリ |
|---|---|---|---|
| SOERU | AI顧問（主力フロント商品） | https://balencer.jp/soeru/ | `docs/soeru-lp/` |
| ミタテ | AI経営分析 | https://balencer.jp/keiei/ | `docs/keiei-board-lp/` |
| ヒトツ | Notion業務基盤 | https://balencer.jp/notion/ | `docs/hitotsu-lp/` |
| 補助金ハブ | 補助金集客ハブ | — | `docs/hojokin-hub-lp/` |

## 送客導線
- 各LP/SNS/記事から `?src=` 付きURLで送客 → Notionリードに流入元が自動記録。
- 認識する値: hojokin / mitate / keiei / hitotsu / notion / soeru / balencer / ai / sns / mail
  （keiei→ミタテ、notion→ヒトツ に正規化）
- 詳細: `docs/送客リンク集.md`

## 営業資料
- 提案デッキ・代理店募集 → `docs/proposals/`
- 見積 → `docs/estimates/`（例: NAILIT 2026）

## その他アプリ
- `apps/outreach/` — アウトリーチ用 Next.js + Supabase アプリ＋ブラウザ拡張。

## 代理店・料金メモ（2026-06時点）
- SOERU代理店手数料: スターター10% / スタンダード以上15%。創業10社特典は全プラン15%＋共催ウェビナー優先。
- SOERU伴走は最低3ヶ月継続が前提。
