# docs/company/ — 会社定義の正本（ここが唯一の正解）

> バレンサーの「何の会社か・何を売るか・実績の数字」の正本はこのフォルダ。
> 会社説明・LP・提案書・スライドを作る時は、**必ずここから引用する**（勝手に言い換えない）。

## ファイル構成

| ファイル | 中身 |
|---|---|
| [identity.md](identity.md) | 会社定義・看板2枚・対象顧客・体制・使わない言葉（NGリスト） |
| [services.md](services.md) | サービスの階段（ENTRANCE→CORE→PROJECT→SUMMIT）と各商品の置き場 |
| [results.md](results.md) | 実績の正（64社・生涯4.03億）と数字の使い方ルール |
| [sales-strategy-2026.md](sales-strategy-2026.md) | 営業戦略2026（対面フェーズ） |

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
