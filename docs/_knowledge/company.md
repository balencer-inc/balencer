# 会社・サービスの共通前提（company）

> 詳細の正本は `docs/handoff/`（concept-summary.html）と `docs/company/`。ここは引き継ぎ用の要点ログ。

## 2026-06-14 秘書＋担当システムをリポジトリに集約
- バレンサーのAI社員（秘書＋各担当）を `.claude/skills/` に集約し、リポジトリを唯一の正解にした。CLI・デスクトップ・クラウド/Webのどこでも同じ秘書が使える状態。
- 既定の振る舞い＝秘書受付→Skillベースで担当へ振り分け（CLAUDE.md 0章・2章）。
- 担当: secretary / dev / marketing / finance / creative / consulting。
- 純汎用スキル（design-system-builder・ui-ux-pro-max）はグローバル設置のまま。
- 旧グローバルスキルは当面バックアップとして残置（`~/.claude/skills-backup-*`）。
- 別ブランチ `claude/secretary-assistance-srl3h6`（クラウドが旧定義で仮作成）は不採用。CLAUDE.md受付・_knowledge構造の発想だけ採り、中身は2026再定義で作り直した。

## 会社定義の要点（2026再定義）
- 経営者の右腕がつとまる、**ブランディングAXカンパニー**（AX＝AIで会社の戦い方を変える）。
- 看板2枚: ①組織開発・MVV ②AI実装。掛け算がブランディングAX。
- サービス階段: SOERU(入口10/20万)→Main右腕(30-50万)→Premium経営参謀(60-100万)→AI組織OS/承継。
- 単体NG: 採用単体・Web/LP/広告単体。旧表現NG: デザインコンサル/1000社支援/Entryプラン/SOERU=AI顧問/右腕を外注。
- 実績の正: 64社・生涯4.03億。代表は阿部さん（tabe@ を「田部」と誤読しない）。
