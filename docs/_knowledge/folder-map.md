# ローカルのファイル構造マップ（2026-09-06 現在）

> 阿部さんのMacの「どこに何があるか」を1枚で掴むための地図。
> **迷ったら1問**: 「次のAIセッションに読ませたいか？」→ Yes なら `Projects/balencer/docs/`、No（見せるだけ）なら Drive。
> 使い方・呼び出し方は [usage-guide.md](usage-guide.md)、保存ルールの正本は [CLAUDE.md](../../CLAUDE.md) 3章。

---

## 0. 全体像 — 入口は2つだけ

```
Mac
├── ~/Projects/balencer/        ★ 入口A（会社）— Claude Code / Codex で開くのはここだけ
└── ~/Documents/my-notes/       ★ 入口B（個人）— Obsidian で開く。非共有
```

この2つ以外（Desktop・Drive・Notion）は**置き場であって入口ではない**。作業はいつも入口Aから始める。

---

## 1. ~/Projects/ — リポジトリは4つ

| フォルダ | 中身 | 位置づけ |
|---|---|---|
| **`balencer/`** | 会社の仕事ほぼ全部 | ★ 会社の唯一の正本。GitHub `balencer-inc/balencer` と同期 |
| `tsugiandpartners/` | TSUGI＆PARTNERS のコード（企業ドック等） | 別リポジトリ |
| `ai-staff/` | AI社員まわりの実験 | 実験場 |
| `machigai-note/` | 間違いノートアプリ（中学受験算数） | 個人プロダクト |

---

## 2. ~/Projects/balencer/ — 全体構成

```
balencer/
├── CLAUDE.md          ★ 会社の記憶。開いた瞬間に自動ロードされる
├── AGENTS.md          → CLAUDE.md へのシンボリックリンク（Codex用。中身は同一）
├── ONBOARDING.md      メンバー向けの入り口ドキュメント（共有リンクで配布）
├── README.md          リポジトリの説明
├── index.html         トップの静的HTML
├── package.json 他    Next.js の設定一式（src/ 用）
│
├── .claude/skills/    ★ AI社員の実体（19スキル）
├── docs/              ★ 成果物とナレッジ（テキストの仕事は全部ここ）
├── src/               バレンサー本体サイトのコード
├── apps/              アプリ（outreach）
├── scripts/           社内用Pythonスクリプト
├── server-scripts/    サーバーPHP（LPのリード受信）
├── outreach-lists/    営業リストCSV
├── deploy/            Vercel配布用の切り出しフォルダ
├── public/ out/ demo/ ビルド成果物・静的アセット
└── node_modules/      （git管理外）
```

---

## 3. .claude/skills/ — AI社員19人（正本はここ。グローバルではない）

```
.claude/skills/
├── ■ 担当6人（秘書が振り分ける先）
│   ├── secretary        受付・ブリーフィング・予定/タスク/議事録/連絡文
│   ├── dev              LP・プロトタイプ・自動化・API連携・外注向け仕様書
│   ├── marketing        SNS下書き・トレンド・note・動画台本・ファネル
│   ├── finance          売上/経費集計・請求チェック・補助金書類・見積補助
│   ├── creative         SNS企画・コピー・キャッチコピー・メンバー指示書
│   └── consulting       提案書・クライアント分析・戦略・MVV・業界リサーチ
│
├── ■ 検品（対外文書は必ず通す）
│   ├── brand-lint       NG表現・全角クォート・AI読点の機械チェック
│   └── ai-judges        4人のAI審査員が100点満点で採点（brand-lintの前段）
│
├── ■ お金
│   ├── estimate         見積書（HTML+CSV+PDF・検算込み）
│   └── invoice          請求書（HTML+PDF・別紙内訳）
│
├── ■ 資料づくり
│   ├── client-deck      議事録 → クライアント提出A4横PDF（6手順の型）
│   ├── monthly-report   顧客の月次報告A4横1枚（Notion議事録DBから）
│   ├── notion-tag-fill  Notion議事録DBの顧客タグ埋め（月次の前段）
│   └── positioning-map  2軸マップ・ビフォーアフター・競合マップ
│
├── ■ デザインの型
│   ├── design-md        472ブランドのギャラリーから見た目を選ぶ
│   └── dads             デジタル庁デザインシステムv2で作る
│
└── ■ その他
    ├── weekly-review    週次定点観測（成果・パイプライン・来週の3件）
    ├── full-telop       動画の全字幕自動化ツールを作る伴走
    └── marketing-shuhei しゅうへい式マーケ壁打ち（個人・スモールビジネス向け）
```

> ⚠️ **グローバル側（`~/.claude/skills/`）にも同名の古い複製がある**（2026-06時点の版）。
> **正はリポジトリ側**。スキルを直す時は必ず `Projects/balencer/.claude/skills/` を編集する。

---

## 4. docs/ — 成果物とナレッジ（21フォルダ）

### 4-1. 中核4フォルダ

| フォルダ | 何を置くか |
|---|---|
| **`company/`** | ◎ 会社定義・戦略の正本。対外文書はここから引用する |
| **`clients/`** | ◎ 顧客案件（1顧客1フォルダ・19社） |
| **`_knowledge/`** | ◎ 社内ナレッジ・決定事項（このファイルもここ） |
| **`tsugi/`** | TSUGI＆PARTNERS の仕事（`matsushita/`） |

### 4-2. 種類別の置き場

| フォルダ | 中身 | 備考 |
|---|---|---|
| `products/` | サービスページ（HP中核）。`ai-training/`（AI研修）・`kaisha-no-kioku/`（会社の記憶） | 商品ごとに定義→価格→事例→営業資料が揃う |
| `proposals/` | 提案書（旧置き場）。`ai-training-2026` `clavis-partners` `rainbow-voice` `soeru-client-deck` `soeru-partner` `tsugi-ma-hearing` | **新規は `clients/<顧客>/01_提案/` へ** |
| `estimates/` | 見積（旧置き場）。`nailit-2026` | **新規は `clients/<顧客>/02_契約・見積/` へ** |
| `invoices/` | 請求書。`2026-08/` `2026-09/` `00_材料/` `ledger.tsv`（採番台帳） | `99_local/` は git管理外 |
| `accounting/` | 経理。`zeirishi-monthly/`（税理士向け月次） | |
| `handoff/` | 共有用ミラー。`pages/`（top・mvv・ai・migiude・soeru）`background/`（CI検討の経緯HTML） | company/ の写し。正本ではない |
| `references/` | 参考資料（ベイジさん資料の画像など） | |
| `_corpus/` | 文章コーパス。`abe-shiso/`（思想）`abe-voice/`（声のトーン） | 阿部さんらしい文章を生成する材料 |
| `blog/` | ブログ原稿HTML | |
| `inbox/` | 未分類の思いつき・まだ箱が決まらない材料 | **通過点**。月次で仕分ける |

### 4-3. LP・サイト（1プロダクト1フォルダ・完成品HTML）

| フォルダ | 公開先 | 中身 |
|---|---|---|
| `hitotsu-lp/` | balencer.jp/notion/ | Notion業務基盤パッケージ「ヒトツ」。index.html＋webp画像一式 |
| `hojokin-hub-lp/` | balencer.jp/hojokin/ | 補助金ハブLP |
| `keiei-board-lp/` | balencer.jp/keiei/ | 経営ボードLP |
| `soeru-lp/` | — | SOERU |
| `intro-site/` | balencer-intro.vercel.app | イベント用2社紹介ページ |
| `online-shodan-2026-06/` | — | オンライン商談まわり |
| `balencer公開アップロード/` | — | ⚠️ FTP配布用ステージング。**git管理外・古い複製**。正本は各LPフォルダ |

---

## 5. docs/company/ — 会社定義の正本（対外文書の引用元）

### 最上位（矛盾したらこれが勝つ）

| ファイル | 役割 |
|---|---|
| `BALENCER_MASTER_CONTEXT.md` | ◎ **会社定義の最上位正本** |
| `BALENCER_DESIGN_SYSTEM.md` | ◎ **デザインの最上位正本** |
| `BALENCER_SERVICE_PRICING_MASTER.md` | ◎ サービス・料金・契約の正本 |

### 実務で引くファイル

| ファイル | 役割 |
|---|---|
| `website-copy-master.md` | コーポレートサイト全13ページの文言正本 |
| `website-structure-2026-08.md` / `.html` | サイト構造 |
| `invoice-constants.md` | 請求書の定数（登録番号・振込先・採番・書式・社印） |
| `invoice-clients.json` | 請求先マスター |
| `sales-strategy-2026.md` | 営業戦略2026 |
| `sales-pipeline-overview.md` | パイプライン概況 |
| `juchu-hoteishiki.md` | 受注の方程式 |
| `funnel-shindan-soudan-design.md` | 診断→相談のファネル設計 |
| `positioning-strategy-2026-fde.md` / `.html` | ポジショニング戦略 |
| `deck-image-prompts.md` | デッキ用の画像生成プロンプト |
| `identity.md` / `services.md` / `results.md` | 上記マスターの補足（**矛盾時はマスター優先**） |
| `_project-bundle.md` | claude.ai の Project ナレッジ用に焼いたまとめ。**生成物・git管理外** |

### サブフォルダ

| フォルダ | 中身 |
|---|---|
| `brand-profile-deck/` | ブランドプロフィールのスライド（HTML+Vercel） |
| `business-deck-web/` | 事業紹介デッキ（Next.js） |
| `sales-pipeline-page/` | パイプラインの閲覧ページ |
| `case-studies/` | 事例（`case-rm-support.md`） |
| `meishi-2026/` | 名刺改訂2026 |

---

## 6. docs/clients/ — 顧客19社

**スラッグの唯一の正**は [clients/README.md](../clients/README.md) の対応表。新規顧客はまず表に1行足してからフォルダを作る。

### 顧客フォルダの中の型（番号で固定）

```
docs/clients/<顧客>/
├── README.md          5行サマリ＋リンク集（最初の1読で全体像が掴める）
├── 00_brief.md        claude.ai 壁打ち用の入口ブリーフ（上限2,000字）。壁打ち結論もここに追記
├── 01_提案/           提案書・営業デッキ
├── 02_契約・見積/     見積・契約書
├── 03_議事録/         打合せの記録
├── 04_成果物/         納品物
├── 05_素材/           画像・資料
└── 99_local/          ⚠️ 個人情報・ログイン情報。**git管理外**（手元のみ）
```

> 全部作る必要はない。**必要になった番号だけ作る**。README.md だけの顧客も多い（＝まだ動いていない）。

### 19社一覧

| スラッグ | 正式名 | 一言 | 進み具合 |
|---|---|---|---|
| `mutsubi` | 睦備建設株式会社 | 京都南部の建設/不動産。**最頻出顧客** | portal・月次レポート・納涼会音響アプリ |
| `nexus-group` | ネクサスグループHD | 飲食3,000名・150店舗超の持株会社。窓口=加藤梨紗さん | 提案〜成果物まで一式。傘下2社を内包 |
| ┗ `事業会社/hassin` | 株式会社HASSIN | 制作部が160店舗分を内製。制作システム伴走 | |
| ┗ `事業会社/hare` | 株式会社HARE | インバウンド「トラベルダイン」。保守引継ぎ相談 | 2026-09-03 にHD配下へ移設 |
| `toyo` | 株式会社東洋 | 機関紙のスマホビュー化（2026-08-29 初回） | 提案〜見積・工数試算まで |
| `clavis-partners` | 株式会社Clavis Partners | ホテル/旅館のレベニュー管理支援。杉山康之さん | 引き継ぎ〜チーム共有まで |
| `osaka-kyoso-lab` | OSAKA共創LAB | 高校生の探究プログラム（大阪府教育庁） | 2026-08〜2027-03。生徒実名は99_localのみ |
| `oishies` | オイシーズ株式会社 | 飲食持株（金子半之助/つじ田/田中商店） | 提案・パッケージ |
| `hokuroku` | 有限会社北麓 | 映像/制作会社。藤橋さん | 提案・議事録・成果物 |
| `nailit` | 株式会社NAILIT | 大阪のセールスプロモ。営業ダッシュボード支援 | やりとり・現状まとめ |
| `1stplace` | 1st PLACE株式会社 | 音楽/IP/音声合成（IA・VOCALOID） | Claude印税分配自動化 |
| `adachi-onken` | 株式会社アダチ音研 | 横浜の音楽教室。5カ年計画 | 定例 |
| `tri-works` | 株式会社トライ・ワークス | 福岡のIoT/AI/開発会社 | 図書セッション・成長テーマ運用 |
| `sunpark` | 株式会社サンパーク | 事業承継・M&A（TSUGI案件）。髙木健社長 | 事前研究ノート |
| `golfeed` | 株式会社ヒューネック | 24hインドアゴルフ「GOLFEED24」 | 提案書 |
| `h2o` | 株式会社エイチ・ツー・オー | 大阪の化粧品メーカー。Shopify EC | 契約・見積 |
| `tas` | 株式会社タスデザイングループ | 神戸＋ベトナムのIT/DX/AI。MVV策定 | README のみ |
| `imamura` | 株式会社イマムラ | 京都の食グループ（アイハート等） | README のみ |
| `harima` | ハリマ紙器印刷工業株式会社 | 加西市の紙器メーカー。HP制作 | README のみ |
| `seibikai` | 清美会 | 医療/福祉系。侭田さん経由 | README のみ |
| `tsugi-ma` | TSUGI 松下さん案件 | 松下幸惠さん | `matsushita-blueprint/` |

---

## 7. docs/_knowledge/ — 社内ナレッジ

| ファイル | 中身 |
|---|---|
| `README.md` | このフォルダの運用ルール（その場で書く／日付＋要点／消さず更新） |
| `knowledge-system.md` | ◎ 知識システムの役割定義・正本（5道具の関係） |
| **`usage-guide.md`** | AI社員の呼び出し方・環境別の開き方（デスクトップ版メイン／Codex併用） |
| **`folder-map.md`** | このファイル。ローカル構造の地図 |
| `team-operations.md` | 3人チーム運用の型・決定記録（正本は1箱・3層モデル・金曜棚卸し） |
| `team-onboarding-send-text.md` | メンバーへ送る文面＆初回セットアップ |
| `team-role-operations-assistant.md` | オペレーション担当の役割定義 |
| `company.md` | 会社・サービスの背景（共通前提） |
| `secretary.md` / `dev.md` / `marketing.md` / `finance.md` / `creative.md` / `consulting.md` | 担当ごとの知見ログ |
| `ai-automation-roadmap.md` | 自動化候補の台帳（新しい改善はまずここに追記） |
| `revenue-management.md` | 売上管理 |
| `marketing-funnel-playbook.md` | ファネルの型 |
| `marketing-matsuura-method.md` | 松浦メソッド |
| `consulting-mvv-and-workshop.md` | MVV策定・ワークショップ設計 |
| `creative-flyer-layout.md` | チラシレイアウト |
| `dev-ui-prompt-per-user.md` / `dev-web-animation-vocab.md` | 開発の知見 |
| `info-audit-2026-07.md` / `drive-cleanup-plan-2026-07.md` | 情報棚卸しの記録 |
| `cloudflare-ai-crawler.md` | AIクローラー対策 |
| `samples/` | サンプル |

---

## 8. コード側

### src/ — バレンサー本体サイト
```
src/
├── app/          Next.js のページ
├── components/   部品
├── data/         データ
└── lib/          ユーティリティ
```
> ⚠️ **本番の balencer.jp は WordPress + Elementor**。このNextリポジトリは本番ではない。静的HTMLはFTPで公開する。

### apps/ — アプリ
```
apps/
├── outreach/            営業メール自動化（Next.js + Supabase）
│   ├── src/ scripts/ supabase/
│   └── README.md SETUP.md
└── outreach-extension/  ブラウザ拡張
```

### scripts/ — 社内用Pythonスクリプト

| ファイル | 用途 |
|---|---|
| `brand_lint.py` | ★ **対外文書の検品**。`python3 scripts/brand_lint.py <file>`（SNSは `--sns`） |
| `md_to_html.py` | md → バレンサートーンの1枚HTML。`python3 scripts/md_to_html.py <in.md>` |
| `build_corpus_html.py` | コーパスのHTML化 |
| `report_fit_check.py` | レポートの適合チェック |
| `zeirishi_matching.py` | 税理士マッチング |

### server-scripts/ — サーバーPHP（LPのリード受信）

| ファイル | 対応するLP |
|---|---|
| `hitotsu-lead.php` | ヒトツLP |
| `hojokin-lead.php` / `hojokin-mail.php` / `hojokin-cron.php` | 補助金ハブLP |
| `keiei-lead.php` | 経営ボードLP |
| `soeru-lead.php` | SOERU LP |
| `ai-training-lead.php` | AI研修 |
| `intro-lead.php` | 紹介サイト |
| `*-config.sample.php` | 設定の雛形。**実値config（notion_token等）はgit管理外** |

---

## 9. git に入らないもの（.gitignore）

**ここにあるファイルは他のPC・クラウド・メンバーには渡らない。**

| パターン | 理由 |
|---|---|
| `**/99_local/` | 顧客フォルダ内の個人情報・ログイン情報 |
| `server-scripts/*-config.php` | APIトークンの実値（sampleのみ管理） |
| `docs/company/_project-bundle.md` | 正本からの生成物（再生成可） |
| `docs/balencer公開アップロード/` | FTP配布用ステージング（古い複製を含む） |
| `docs/proposals/clavis-partners/deploy-teian/` | 同上 |
| `.env*` | 環境変数 |
| `node_modules/` `.next/` `out/` `.vercel` | ビルド成果物 |
| `.obsidian/` | docs/ を第2Vaultとして開いた時の設定 |

---

## 10. ~/Documents/my-notes/ — 個人Vault（Obsidian・非共有）

```
my-notes/
├── CLAUDE.md                    個人Vault側の運用ルール
├── Inbox/                       毎日インプットを投げる場所。週1でClaudeに処理させる
├── ノート/                      整理済みのノート
│
├── ■ 人生設計（正本はここ。会社リポジトリには置かない）
│   ├── 人生設計_完成版_2026-08-05.md      ★ 完成版v1.0
│   ├── 人生設計_ゴールからの逆算.md
│   ├── 人生設計_実行シート_2026-2028.md
│   ├── 人生設計_対話サマリ_2026-08-05.md
│   ├── 人生設計_資料インデックス.md
│   ├── 人生設計_助言メモ_お金.md
│   ├── 人生設計_ビジョン_対外共有版.md     共有可の版
│   ├── 人生設計_信頼者共有版_v2.md         信頼者のみ
│   └── 人生のビジョンと計画.md
│
└── ■ 阿部さん個人の前提（文章生成の材料）
    ├── 自分の前提.md / 判断基準.md / 声のトーン.md
    ├── 思想のタネ.md / SNS音声からの思想メモ.md
    ├── 今の仕事.md / 過去の成果物.md / 参考資料.md
    └── 逆算メソッド_リサーチ素材.md
```

**会社リポジトリと混ぜない。** 私的な数字・見せたくない思考はここだけ。逆に会社の仕事はここに置かない。

---

## 11. ~/Desktop/ — 一時作業と現物置き場（正本ではない）

Desktop は**通過点**。ここにあるのは「Driveの現物のコピー」か「作業中の一時物」。

| フォルダ | 中身 |
|---|---|
| `バレンサー資料庫/` | 資料の現物 |
| `睦備 月次レポート/` | 月次レポートの出力先 |
| `8月請求/` | 請求書の出力 |
| `オイシーズ商談_2026-07-29/` | 商談ごとの一時フォルダ |
| `Clavis_Partners_相談用_2026-07-31/` | 同上 |
| `人生設計_2026-08-05/` | 人生設計の作業物（正本はObsidian） |
| `abe-takayuki/` `阿部パーソナル/` | 個人まわり |
| `しっかり記事SEO/` | SEO記事 |
| `distribution/` `drive-download-*/` | Driveからの落とし物 |
| `一時保管/` | 一時物 |

> **溜まったら移す**: 正本にすべきなら `docs/` へ、共有現物なら Drive へ。放置すると迷子になる。
> ファイル選択ダイアログで使うものは、事前にここへエイリアスかコピーを置く運用。

---

## 12. ~/.claude/ — Claude Code の設定

```
~/.claude/
├── settings.json / settings.local.json   グローバル設定
├── skills/          ⚠️ 古い複製あり（下記）
├── projects/        プロジェクトごとのメモリと会話ログ
│   └── -Users-abetakayuki-Projects-balencer/
│       ├── memory/      ローカルメモリ118件（MEMORY.md が索引）
│       └── *.jsonl      会話ログ（消えたセッションはここをgrepで復元）
├── scheduled-tasks/  定期実行
└── plugins/ cache/ backups/
```

**`~/.claude/skills/` の注意**: `secretary` `dev` `marketing` `finance` `creative` `consulting` の**古い複製（2026-06版）が残っている**。中身はリポジトリ側と既に食い違っている。
**正はリポジトリ側**（`Projects/balencer/.claude/skills/`）。純汎用の `design-system-builder` と `ui-ux-pro-max` だけがグローバル固有。

---

## 13. ローカルの外（正本がここにあるもの）

| 場所 | 何が正本か |
|---|---|
| **GitHub `balencer-inc/balencer`** | ◎ 会社の正本。ローカルの `Projects/balencer` と同期 |
| **Google Drive** | △ 数字の原本（7期営業管理シート・売掛金管理表・クライアント案件フォルダ）、メンバー共有の現物 |
| **Notion** | △ 運用データ（議事録DB・顧客管理DB・リードDB・SNSネタ帳・サービス資料・企業ドック） |

> Drive の実体はローカルに落とさない。git 側には**リンク＋1行説明のポインタmd**を置く。
> Notion は「URL指定した1ページ」以外読まない（DB全query・ツリー総なめは禁止）。

---

## 14. 迷った時の判定フロー

```
その成果物は…
│
├─ 次のAIセッションに読ませたい？ ── Yes ──→ Projects/balencer/docs/
│                                             │
│                                             ├─ 会社の定義・戦略 ──→ docs/company/
│                                             ├─ 顧客の仕事 ────────→ docs/clients/<スラッグ>/
│                                             │                          ├ 提案   → 01_提案/
│                                             │                          ├ 見積   → 02_契約・見積/
│                                             │                          ├ 議事録 → 03_議事録/
│                                             │                          ├ 納品物 → 04_成果物/
│                                             │                          ├ 素材   → 05_素材/
│                                             │                          └ 個人情報 → 99_local/（git外）
│                                             ├─ TSUGI ─────────────→ docs/tsugi/
│                                             ├─ 商品ページ ────────→ docs/products/<商品>/
│                                             ├─ LP ────────────────→ docs/<プロダクト>-lp/
│                                             ├─ 決定・知見 ────────→ docs/_knowledge/
│                                             └─ まだ箱が決まらない → docs/inbox/
│
├─ 見せるだけ（Excel・PDF最終納品・メンバー手編集）？ → Google Drive（git側にポインタmd）
│
├─ 溜め続ける運用データ・追客・ネタ？ → Notion
│
└─ 阿部さん個人の思考・私的な数字？ → Obsidian（~/Documents/my-notes）
```

---

## 15. よくある取り違え（ここだけ覚える）

| 間違えやすい | 正しくは |
|---|---|
| `~/.claude/skills/` のスキルを直す | **リポジトリの `.claude/skills/`** が正。グローバルは古い複製 |
| `docs/balencer公開アップロード/` を編集する | **各LPフォルダ**（`docs/*-lp/`）が正。公開アップロードは古い複製・git外 |
| `docs/handoff/` を書き換える | **`docs/company/`** が正。handoff は共有用ミラー |
| `identity.md` の記述を優先する | **`BALENCER_MASTER_CONTEXT.md`** が最上位。矛盾したらマスター |
| 新しい提案を `docs/proposals/` に作る | **`docs/clients/<顧客>/01_提案/`** へ。proposals は旧置き場 |
| `src/` を直せば balencer.jp が変わる | **本番は WordPress + Elementor**。Nextリポは本番ではない |
| 顧客の個人情報を `03_議事録/` に書く | **`99_local/`**（git管理外）へ |

---

## 更新履歴

- 2026-09-06 初版。デスクトップ版メイン化＋Codex併用の整備にあわせて作成
- 2026-09-06 詳細版に改稿。スキル19本の分類・顧客19社の一覧・docs全21フォルダ・git管理外の一覧・取り違えリストを追加
