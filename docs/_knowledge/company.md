# 会社・サービスの共通前提（company）

> 詳細の正本は `docs/handoff/`（concept-summary.html）と `docs/company/`。ここは引き継ぎ用の要点ログ。

## 2026-06-14 秘書＋担当システムをリポジトリに集約
- バレンサーのAI社員（秘書＋各担当）を `.claude/skills/` に集約し、リポジトリを唯一の正解にした。CLI・デスクトップ・クラウド/Webのどこでも同じ秘書が使える状態。
- 既定の振る舞い＝秘書受付→Skillベースで担当へ振り分け（CLAUDE.md 0章・2章）。
- 担当: secretary / dev / marketing / finance / creative / consulting。
- 純汎用スキル（design-system-builder・ui-ux-pro-max）はグローバル設置のまま。
- 旧グローバルスキルは当面バックアップとして残置（`~/.claude/skills-backup-*`）。
- 別ブランチ `claude/secretary-assistance-srl3h6`（クラウドが旧定義で仮作成）は不採用。CLAUDE.md受付・_knowledge構造の発想だけ採り、中身は2026再定義で作り直した。
- 旧版（デスクトップ版が今朝mainに入れたagents方式）は正版へ置換。実務ノウハウは新スキルへ救済済み: dev＝本体サイトのコードマップ/GitHubはmcp__github__*（gh不可）/JSON-LD・OGP・base64禁止等のLP実務、secretary＝Gmail/Slack/Drive操作と外部送信前の承認、marketing＝媒体別フォーマット規定(FBノート2,300〜2,500字必達)・濃さの基準・ウォームアップ運用・施策の型。旧ブランド表現（SOERU=AI顧問/田部）は破棄。`docs/soeru-consultation-patterns.md`は保持。

## 会社定義の要点（2026再定義）
- 経営者の右腕がつとまる、**ブランディングAXカンパニー**（AX＝AIで会社の戦い方を変える）。
- 看板2枚: ①組織開発・MVV ②AI実装。掛け算がブランディングAX。
- サービス階段: SOERU(入口10/20万)→Main右腕(30-50万)→Premium経営参謀(60-100万)→AI組織OS/承継。
- 単体NG: 採用単体・Web/LP/広告単体。旧表現NG: デザインコンサル/1000社支援/Entryプラン/SOERU=AI顧問/右腕を外注。
- 実績の正: 64社・生涯4.03億。代表は阿部さん（tabe@ を「田部」と誤読しない）。

## 2026-07-07 情報資産監査（ローカル×Drive×Notion）を実施
- 全域棚卸しの結果と改善計画は `docs/_knowledge/info-audit-2026-07.md` に記録。
- 根本原因: 三層構造（正本docs/→ミラーNotion→実務Drive）の実装が半分止まり。特に `docs/company/` が正本宣言なのに実質空（sales-strategy 1本のみ）。
- 最優先: Drive内 pass+.txt（平文パスワード疑い）の処理 → docs/company/ 正本実体化（P1）→ Notion旧定義8ページ矯正（P2）→ Drive整理（P3）→ 月1仕分けの自動化（P4）。
- 眠っている資産: Drive休眠クライアントフォルダ約30個＝営業戦略2026「休眠掘り起こし」の一次材料。Notion顧客管理DBへの接続が宿題。

## 2026-07-07 P1完了: docs/company/ 正本を実体化
- `docs/company/` に正本4ファイルを作成: README.md（正本宣言・ミラー関係・更新ルール）／identity.md（会社定義・看板2枚・NGリスト）／services.md（サービスの階段と各商品の置き場）／results.md（実績の正64社・4.03億と数字ルール）。
- 出典: handoff/background/concept-summary.html（2026年6月制定の再定義文書）＋CLAUDE.md 1章。concept-summary自身が指す正本名 identity.md に合わせた。
- CLAUDE.md 1章の正本ポインタを更新（handoff＝共有用ミラーに降格、正本はdocs/company/一本）。
- Notion情報マップ（37c53269fc5e81c3…）の「※整備中」を解消し、引用元をdocs/company/の3ファイルに更新。「未整備の間はサービス資料マスター原本」の代理指定を廃止。
- 残課題: Notionサービス資料マスター原本の旧定義（R-1 Entry）矯正はP2で実施。情報マップ記載の docs/go-to-market/ はローカルに未作成（実体は docs/company/sales-strategy-2026.md と docs/_knowledge/）。
