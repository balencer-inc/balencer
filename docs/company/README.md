# docs/company/ — 会社定義の正本（ここが唯一の正解）

> バレンサーの「何の会社か・何を売るか・実績の数字」の正本はこのフォルダ。
> 会社説明・LP・提案書・スライドを作る時は、**必ずここから引用する**（勝手に言い換えない）。

## ファイル構成（★=最上位正本。2026-07-28）

| ファイル | 中身 |
|---|---|
| ★ [BALENCER_MASTER_CONTEXT.md](BALENCER_MASTER_CONTEXT.md) | **会社理解の最上位正本**。定義・中心思想・4支援領域・事例・言葉遣い基準・NG表現・基本情報 |
| ★ [BALENCER_DESIGN_SYSTEM.md](BALENCER_DESIGN_SYSTEM.md) | **デザイン判断の最上位正本**。カラー（白×グラファイト×コバルト）・タイポ・レイアウト・素材・生成AIプロンプト基準 |
| ★ [BALENCER_SERVICE_PRICING_MASTER.md](BALENCER_SERVICE_PRICING_MASTER.md) | **サービス・料金・契約の最上位正本**。SPOT／CONSULT／PARTNER／EXECUTIVE／PROJECT・料金・契約条件・相談導線 |
| [identity.md](identity.md) | （配下の補足）会社定義・対象顧客・体制・NGリスト |
| [services.md](services.md) | （配下の補足）サービス正式名称と各商品の置き場・価格 |
| [results.md](results.md) | （配下の補足）実績の正（64社・生涯4.03億）と数字の使い方 |
| [sales-strategy-2026.md](sales-strategy-2026.md) | 営業戦略2026（対面フェーズ） |

**矛盾したら ★の2マスターが最優先**。identity/services/results はマスターに整合する補足として扱う。

## 正本とミラーの関係

```
正本: docs/company/（このフォルダ）
  ├─ 共有用ミラー: docs/handoff/（HTMLデッキ。balencer.jp/handoff/ で公開）
  ├─ 閲覧用ミラー: Notion「バレンサー情報マップ」配下
  └─ 要点ログ: docs/_knowledge/company.md（変更履歴・引き継ぎ用）
```

- **更新は必ず正本から**。ミラーが正本より新しい状態を作らない
- 定義を変えたら: ①ここを更新 → ②handoff/Notionミラーに反映 → ③`docs/_knowledge/company.md` に「## YYYY-MM-DD」で履歴を残す → ④コミット＆プッシュ
- 対外文書は公開前に brand-lint（旧表現チェック）を通す
