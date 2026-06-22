# 1st PLACE株式会社（村山久美子 CEO）案件

休眠掘り起こしメールから相談に発展した案件。本命は **Claude活用の印税分配の自動化**（受託開発）。研修部分は厚労省リスキリング助成金で受注する二段構え。

## 商談
- **2026-06-22(月)16:00 オンライン**（赤坂訪問は村山さん都合で不成立→オンラインに変更）

## このフォルダの資料
| ファイル | 用途 |
|---|---|
| `提案_村山様_進め方.html` | **本命の提案書（縦型）**。H1「バックオフィスDX化・AI研修」。要件整理→4つの道→テーマ別おすすめ→まず現状確認(印税mock埋込)→研修(別冊あり)→ミタテ→今日決める3点。挨拶なし・診断型・謙虚に現状確認のトーン（[[feedback_proposal_tone_meeting_docs]]）。mock画像をsection04に埋め込み済 |
| `別冊_研修プラン_村山様.html` | **研修の別冊**（道②を選ぶ場合の詳細）。狙い→カリキュラム15h→費用(助成で実質10-25万)→助成金フロー＋役割分担。見せるかは当日判断 |
| `商談設計_村山様_0622.md` | 内部ブリーフ（回し方・時間配分・想定問答・トーク）。社外に出さない |
| `加藤さん共有メモ_0622.md` | 同席する加藤さんへの事前共有＋意見回収4点 |

## 見せれるもの（サンプルmock＋実績）
当日「こういうことができる」を具体で見せる材料。索引＝`見せれるもの_index.html`。
| ファイル | 中身 | テーマ |
|---|---|---|
| `mock-royalty.html` | 印税分配エンジンのサンプル画面（取込→正規化→自動分配→支払通知書）。架空データ | 印税分配（本命） |
| `mock-email.html` | 問い合わせ自動対応のサンプル画面（自動仕分け→振り分け→返信下書き）。架空データ | メール対応 |
| `mock-workflow.html` | 業務仕組み化の概念図（Claudeスキル×Notion） | ワークフロー仕組み化 |
| `見せれるもの_index.html` | 上記mock＋実在資産（NAILIT事例/outreach/ミタテデモ）＋サイボウズ/Eight洗い出しカードの索引 | 全体 |
- 実在の他社例：NAILIT事例(`docs/proposals/ai-training-2026/case-study.html`)／outreachアプリ(`apps/outreach`・起動要)／ミタテデモ(balencer.jp/keiei-demo/)。
- **要・場所共有**：睦備建設の業務アプリ／睦備メンバーの名刺管理アプリはリポジトリに無い→URL/スクショがあれば索引に追加（Eight移管の見せ物として有効）。

## 公開URL（Vercel・加藤/クライアント共有用）
- **本番: https://1stplace-murayama.vercel.app** （= 提案_村山様_進め方.html）
- 同ドメイン配下: `/mock-royalty.html` `/mock-email.html` `/mock-workflow.html` `/case-study.html` `/training.html`(別冊)
- Vercelプロジェクト名 `1stplace-murayama`（チーム tabe-balencerjps-projects）。**本番balencer(Next.js)とは別プロジェクト**。
- 再デプロイ手順（自己完結フォルダを組んでCLIデプロイ。`../../`参照をローカルに書換えるのが肝）:
  ```bash
  cd docs/clients/1stplace
  D=/tmp/1stplace-murayama; rm -rf "$D"; mkdir -p "$D/img"
  sed -e 's#\.\./\.\./soeru-lp/balencer-logo\.png#balencer-logo.png#g' -e 's#\.\./\.\./proposals/ai-training-2026/case-study\.html#case-study.html#g' 提案_村山様_進め方.html > "$D/index.html"
  sed 's#\.\./\.\./soeru-lp/balencer-logo\.png#balencer-logo.png#g' 別冊_研修プラン_村山様.html > "$D/training.html"
  cp mock-royalty.html mock-email.html mock-workflow.html "$D/"
  sed 's#\.\./\.\./soeru-lp/balencer-logo\.png#balencer-logo.png#g' ../../proposals/ai-training-2026/case-study.html > "$D/case-study.html"
  cp ../../soeru-lp/balencer-logo.png "$D/"; cp img/mock-*.png "$D/img/"
  cd "$D" && npx vercel deploy --prod --yes --scope tabe-balencerjps-projects
  ```
  ※CLI認証は `~/Library/Application Support/com.vercel.cli/auth.json` に保存済（ログイン済）。

## 赤入れ用Notion（提案HTMLの原稿）
- 提案HTMLの全内容をセクション構造で書き出したページ：https://app.notion.com/p/38553269fc5e81048f58d06344a74b2a
- 運用：本文・言い回しはNotionで直接編集（赤入れ）、デザインは箇所コメントで指示。各見出しに `【#section-id】` でHTML対応箇所を明記。編集後「反映して」でNotion→HTMLへ反映する

## 関連（別フォルダ）
- スライド版デッキ・カリキュラム表・見積書見本：`docs/proposals/ai-training-2026/`（index.html / samples/）。デッキはトーンと構造の理由から本フォルダの縦型HTMLに作り直し済み
- 制度の正：メモリ「AI研修＝リスキリング助成金で受注」

## 進め方の骨子（2026-06-20 方針確定）
久しぶりのオンライン＝研修を売る場ではなく、**メールでいただいたテーマを構造で整理し、叶え方の選択肢を出して一緒に選ぶ**相談の場。
1. 5テーマを性質で整理（A仕組み化＝印税分配/ワークフロー/メール ・ B引っ越し＝サイボウズ/Eight ・ C対象外＝法務）。
2. 叶え方の4つの道を提示：①受託で作る（印税分配＝本命）②研修で自走（リスキリング助成金・希望あれば次回に詳細プラン）③ミタテ拡張＋補助金（経営の数字の見える化ニーズがあれば。採択済み）④引っ越し支援（後回し）。
3. 今日決めるのは方向だけ＝(1)印税分配を動かすか→サンプル2〜3種→要件定義→見積 (2)研修は要るか (3)経営の数字を見たいか。金額は後出し、受託額は資料に出さない。
- **研修は主役にしない**（希望があればの選択肢）。**ミタテはスコープ外と決めつけない**（要件が補助金で叶うなら拡張受注もアリ。ただし印税分配やメールそのものは経営分析枠の補助金には乗らない＝線引きは正直に）。
