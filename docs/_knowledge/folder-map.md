# ローカルのファイル構造マップ（2026-09-06 現在）

> 阿部さんのMacの「どこに何があるか」を1枚で掴むための地図。
> **迷ったら1問**: 「次のAIセッションに読ませたいか？」→ Yes なら `Projects/balencer/docs/`、No（見せるだけ）なら Drive。
> 使い方・呼び出し方は [usage-guide.md](usage-guide.md)、保存ルールの正本は [CLAUDE.md](../../CLAUDE.md) 3章。

---

## 0. 全体像 — 入口は2つだけ

```
Mac
├── ~/Projects/balencer/        ★ 入口A（会社）— Claude Code で開くのはここだけ
└── ~/Documents/my-notes/       ★ 入口B（個人）— Obsidian で開く。非共有
```

この2つ以外（Desktop・Drive）は**置き場であって入口ではない**。Claude Code は入口Aから起動する。

---

## 1. ~/Projects/ — コードとリポジトリ

```
~/Projects/
├── balencer/            ★ 会社の唯一の正本。ほぼ全部の仕事がここ
├── tsugiandpartners/      TSUGI＆PARTNERS のコード
├── ai-staff/              AI社員まわりの実験
└── machigai-note/         間違いノートアプリ（中学受験算数・個人プロダクト）
```

---

## 2. ~/Projects/balencer/ — 会社の正本（ここが本丸）

```
balencer/
├── CLAUDE.md            ★ 会社の記憶。全セッションで自動ロードされる
├── AGENTS.md            → CLAUDE.md へのシンボリックリンク（Codex 用。中身は同一）
│
├── .claude/skills/      ★ AI社員の実体（19スキル）
│   ├── secretary / dev / marketing / finance / creative / consulting   ← 担当6人
│   ├── brand-lint / ai-judges / estimate / invoice / weekly-review     ← 工程
│   ├── client-deck / monthly-report / notion-tag-fill / positioning-map
│   └── design-md / dads / full-telop / marketing-shuhei
│
├── docs/                ★ 成果物とナレッジ。テキストの仕事はすべてここ
│   ├── company/           ◎ 会社定義の正本（後述）
│   ├── clients/           ◎ 顧客案件（1顧客1フォルダ・19社）
│   ├── _knowledge/        ◎ 社内ナレッジ・決定事項（このファイルもここ）
│   ├── tsugi/             TSUGI の仕事
│   ├── inbox/             未分類の思いつき（通過点。月次で仕分け）
│   │
│   ├── products/          サービスページ（HP中核）
│   ├── proposals/         提案書（旧置き場。新規は clients/ 配下へ）
│   ├── estimates/         見積（旧置き場。新規は clients/ 配下へ）
│   ├── invoices/          請求書
│   ├── accounting/        経理
│   ├── handoff/           共有用ミラー（company/ の写し）
│   ├── references/        参考資料
│   ├── _corpus/           文章コーパス
│   ├── blog/              ブログ原稿
│   │
│   ├── hitotsu-lp/        LP各種（1プロダクト1フォルダ）
│   ├── hojokin-hub-lp/
│   ├── keiei-board-lp/
│   ├── soeru-lp/
│   ├── intro-site/        イベント用2社紹介ページ
│   └── online-shodan-2026-06/
│
├── src/                 バレンサー本体サイト（※本番はWordPress+Elementor）
├── apps/outreach/       営業メール自動化アプリ
├── scripts/             社内用の業務スクリプト（brand_lint.py 等）
├── server-scripts/      サーバーPHP（LPリード処理。実値configはgitignore）
└── outreach-lists/      営業リストCSV
```

### docs/company/ — 会社定義の正本（対外文書はここから引用する）

| ファイル | 役割 |
|---|---|
| `BALENCER_MASTER_CONTEXT.md` | ◎ **最上位正本**。会社定義。矛盾したらこれが勝つ |
| `BALENCER_DESIGN_SYSTEM.md` | ◎ **デザインの最上位正本** |
| `BALENCER_SERVICE_PRICING_MASTER.md` | ◎ サービス・料金・契約の正本 |
| `website-copy-master.md` | コーポレートサイト全13ページの文言正本 |
| `invoice-constants.md` / `invoice-clients.json` | 請求書の定数（登録番号・振込先・採番） |
| `sales-strategy-2026.md` / `sales-pipeline-overview.md` | 営業戦略・パイプライン |
| `_project-bundle.md` | claude.ai の Project ナレッジ用に焼いたまとめ（生成物） |
| `identity.md` / `services.md` / `results.md` | 上記2マスターの補足（矛盾時はマスター優先） |

### docs/clients/ — 顧客案件（1顧客1フォルダ）

スラッグの**唯一の正**は [clients/README.md](../clients/README.md) の対応表。新規顧客はまず表に1行足してからフォルダを作る。

```
1stplace  adachi-onken  clavis-partners  golfeed  h2o  harima  hokuroku
imamura   mutsubi       nailit           nexus-group  oishies
osaka-kyoso-lab  seibikai  sunpark  tas  toyo  tri-works  tsugi-ma
```

各顧客フォルダの中の型:

```
docs/clients/<顧客>/
├── README.md          5行サマリ＋リンク集（最初の1読で全体像）
├── 00_brief.md        claude.ai 相談用の貼り付けパック（2,000字上限）
├── 01_提案/
├── 02_契約・見積/
├── 03_議事録/
└── 04_成果物/
```

---

## 3. ~/Documents/my-notes/ — 個人Vault（Obsidian・非共有）

```
my-notes/
├── CLAUDE.md          個人Vault側の運用ルール
├── Inbox/             毎日インプットを投げる場所。週1で処理
├── ノート/
└── 人生設計_*.md      人生設計・ビジョン（私的な数字を含む）
```

**会社リポジトリと混ぜない。** 個人の思考・見せたくない数字はここだけに置く。逆に会社の仕事はここに置かない。

---

## 4. ~/Desktop/ — 一時作業と現物置き場（正本ではない）

Desktop は**通過点**。ここにあるものは「Driveの現物のコピー」か「作業中の一時物」で、正本ではない。

| フォルダ | 中身 |
|---|---|
| `バレンサー資料庫/` | 資料の現物 |
| `abe-takayuki/` / `阿部パーソナル/` | 個人まわり |
| `睦備 月次レポート/` | 月次レポートの出力先 |
| `8月請求/` | 請求書の出力 |
| `一時保管/` | 一時物 |
| `distribution/` / `drive-download-*/` | Driveからの落とし物 |

> Desktop に溜まったものは、**正本にすべきなら `docs/` へ、共有現物なら Drive へ**移す。放置すると迷子になる。

---

## 5. ~/.claude/ — Claude Code の設定（触るのは settings.json くらい）

```
~/.claude/
├── settings.json        グローバル設定
├── skills/              グローバルスキル（design-system-builder / ui-ux-pro-max）
├── projects/            プロジェクトごとのメモリと会話ログ（jsonl）
└── sessions/            セッション記録
```

- **AI社員スキルの正は `Projects/balencer/.claude/skills/`**（グローバルではない）。修正はリポジトリ側を編集する
- 消えたセッションの復元は `~/.claude/projects/` の jsonl を grep

---

## 6. ローカルの外（正本がここにあるもの）

| 場所 | 何が正本か |
|---|---|
| **GitHub `balencer-inc/balencer`** | ◎ 会社の正本。ローカルの `Projects/balencer` と同期 |
| **Google Drive** | △ 数字の原本（営業管理シート・売掛金管理表）、メンバー共有の現物 |
| **Notion** | △ 運用データ（議事録DB・リードDB・SNSネタ帳・企業ドック） |

> Drive の実体はローカルに落とさない。git 側には**リンク＋1行説明のポインタmd**を置く。

---

## 7. 迷った時の判定フロー

```
その成果物は…
│
├─ 次のAIセッションに読ませたい？ ─── Yes ──→ Projects/balencer/docs/
│                                              │
│                                              ├─ 会社の定義・戦略 → docs/company/
│                                              ├─ 顧客の仕事     → docs/clients/<スラッグ>/
│                                              ├─ TSUGI          → docs/tsugi/
│                                              ├─ 決定・知見     → docs/_knowledge/
│                                              └─ まだ決まらない → docs/inbox/
│
├─ 見せるだけ（Excel・PDF最終納品・メンバー手編集）？ → Google Drive（git側にポインタmd）
│
├─ 溜め続ける運用データ・追客・ネタ？ → Notion
│
└─ 阿部さん個人の思考・私的な数字？ → Obsidian（~/Documents/my-notes）
```

---

## 更新履歴

- 2026-09-06 初版。デスクトップ版メイン化＋Codex併用の整備にあわせて作成
