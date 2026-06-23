# AI実装研修 商品パッケージ（リスキリング助成金 活用）

特定顧客に依存しない、汎用のAI研修商品一式。クライアントは**人材開発支援助成金（事業展開等リスキリング支援コース）**を使って実質負担を抑えて受講できる。研修を入口に、後段の実装（受託開発／SOERU）へ引き上げる。

> 1st PLACE向けの個別案件は `docs/proposals/ai-training-2026/` ＋ `docs/clients/1stplace/`。こちらは固有名を抜いた汎用版。

## 中身

| ファイル | 用途 | 出す相手 |
|---|---|---|
| `index.html` | 商品概要＝サービスページ（縦型LP）。何を・誰に・実質いくら・進め方・FAQ | 見込み客（Web/共有） |
| `client-guide.html` | ご利用の手引き（契約後〜入金まで・役割分担・落とし穴）。A4 | 契約前後のクライアント |
| `curriculum-template.html` | カリキュラム表テンプレ（計画届添付用）。A4。標準15h＋構成バリエーション | クライアント／社労士 |
| `estimate-template.html` | 見積書テンプレ（委託訓練・助成対象/対象外の2層）。A4 | クライアント |
| `market-research.md` | 競合相場分析・価格設計の根拠・実質負担シミュレーション | 社内 |
| `sales-playbook.md` | 営業の型（入口トーク・想定問答・引き上げ動線・守る線） | 社内 |

## 使い方（案件ごと）

1. `index.html` で興味喚起 → 商談。商談トークは `sales-playbook.md`。
2. ヒアリング後、`curriculum-template.html` と `estimate-template.html` の `〇〇〇〇株式会社`・`〇/〇`・人数・金額を実値に差し替えて提示。
3. 契約後は `client-guide.html` を渡して、社労士と進める段取りを共有。
4. 研修第4回で出た実業務を、受託開発／SOERUの提案につなぐ。

## 大事な前提（制度）

- **申請主体はクライアント（事業主）。研修提供側（バレンサー）に登録・認定は不要**＝どの会社でも研修を売れる。
- 申請代行は社労士の専権業務。バレンサーは研修＋添付書類まで。
- **委託訓練として組む**（受講料全体が助成対象。1人30万円以内に収める）。
- 計画届＝研修開始1ヶ月前まで／支給申請＝研修終了後2ヶ月以内（期限厳守）。
- 対象年度は令和8年度（2026）。数字・要件は改定あり、最終は労働局／社労士で確認。
- 制度の確定事項の正本＝`docs/_knowledge/consulting.md`（2026-06-23エントリ）。

## 問い合わせフォーム（index.html）

`index.html` のCTAは他LPと同じリードフォーム。送信先は `/ai-training-lead.php`（`server-scripts/ai-training-lead.php`）。社内へメール通知＋Notion DB（補助金/ヒトツと同一DB・流入元「AI実装研修（リスキリング助成金）」で区別）に登録。Notion認証は `hojokin-config.php` を共用。**公開時はindex.htmlとai-training-lead.phpを同じ階層にFTPアップロードする**（フォームは絶対パス `/ai-training-lead.php` を叩く）。

## PDF化

各HTMLをChromeで開き、印刷 → PDF保存（A4縦）。`index.html` はWeb公開想定（FTP）。
