# イベント用 紹介ページ（2社：バレンサー / TSUGI＆PARTNERS）

対外イベントの場で、**繋いでくれる人（紹介者）が2社を理解して、いろんな人にアサイン（紹介）しやすくする**ための一枚もの紹介ページ。コーポレートサイトとは別建て・公式サイトには未反映。読み手の中心は**大手メーカー・中小企業の経営者**。

## 公開URL
- **本番（正・SEO的に最強）: https://balencer.jp/abe-takayuki/** ← balencer.jpサブディレクトリ。FTPで静的設置（WP/Elementor外で素通り公開）。ドメイン評価をbalencer.jp本体に集約でき、初見の信頼も高い。
  - 設置手順：`index.html`＋`img/` を `public_html/abe-takayuki/` に上げる（= `ai-training/` 等と同じ静的設置パターン）。`server-scripts/README.md` 参照。FTPで上げやすいよう **デスクトップに `abe-takayuki/` フォルダ一式を用意済**（フォルダごとpublic_htmlへドラッグ＝そのままURLになる）。
  - フォーム送信先は絶対URL `https://balencer.jp/intro-lead.php` のため、同一ドメインになっても変更不要（むしろ同一オリジンで構成がシンプル）。
- **検索登録**: 2026-06-24、Google Search Console（balencer.jpプロパティ）でURL検査→`https://balencer.jp/abe-takayuki/` のインデックス登録をリクエスト済み。静的フォルダのためWP自動sitemap.xmlには非掲載＝URL検査が登録ルート。確認は数日後 `site:balencer.jp/abe-takayuki/` で。
- **ステージング（下書き確認用）: https://balencer-intro.vercel.app**
  - Vercelプロジェクト名 `balencer-intro`（チーム tabe-balencerjps-projects）。**本番balencer(Next.js)とは別プロジェクト**＝公式サイトに影響なし。編集中の確認用に残す。
- 再デプロイ手順（自己完結フォルダを組んでCLIデプロイ。画像は `img/` 同梱で相対パスのみ＝書換え不要）:
  ```bash
  cd docs/intro-site
  D=/tmp/balencer-intro; rm -rf "$D"; mkdir -p "$D/img"
  cp index.html "$D/index.html"; cp img/*.png "$D/img/"
  cd "$D" && npx vercel deploy --prod --yes --scope tabe-balencerjps-projects
  ```
  ※CLI認証はログイン済（`~/Library/Application Support/com.vercel.cli/auth.json`）。

## このフォルダの資料
| ファイル | 用途 |
|---|---|
| `index.html` | **紹介ページ本体（一枚もの）**。構成：経歴＋出版 → バレンサー厚め（AX定義・看板2枚・相性のいい会社）→ 変遷と変革事例3枚 → TSUGI接続（背景→4ステップ）→ 2社の関係 → 紹介者向けCTA「こんな経営者がいたら繋いでください」＋公式サイトリンク2本 |
| `self-intro.txt` | **イベント自己紹介欄に貼るコピペ用テキスト（984字／1,800字以内）**。再定義の正本ベース、旧情報なし。阿部さん赤入れ済の確定版 |
| `img/abe-round.png` | まる抜き（円形）顔写真。SOERU LPと同一素材 |
| `img/balencer-logo.png` | バレンサーロゴ |

## 相談フォーム（他LPと同じ PHP→Notion 方式）
- ページ末尾 `#contact` に設置。送信先＝`https://balencer.jp/intro-lead.php`（絶対URL）。
- 受け皿PHP＝`server-scripts/intro-lead.php`。①info@balencer.jp へメール通知 ②Notion DB（補助金/SOERUリードと同一DB）へ「流入元＝イベント紹介ページ」で登録。設定は既存 `hojokin-config.php` を流用（新規設定不要）。
- **Vercel(別ドメイン)→balencer.jp へ送るため CORS 対応済**（`Access-Control-Allow-Origin: *`＋OPTIONSプリフライト処理）。
- **稼働に必要な手動作業（FTP）**：`server-scripts/intro-lead.php` を balencer.jp のルートへアップロード（= `https://balencer.jp/intro-lead.php`。`soeru-lead.php` と同じ置き場所）。アップロードするまでフォーム送信は失敗し、`info@balencer.jp` へのメール導線で代替される。

## 内容の根拠・トーン
- 会社定義は**再定義の正本**（`docs/handoff/` concept-summary.html）から引用。旧表現（「1,000社支援」「デザインコンサルティングカンパニー」「組織に魂を/ビジネスに武器を」）は不使用。
- 看板は2枚（①組織開発・MVV ②AI実装）。ブランディングAX＝AIで会社の戦い方を変える、で統一。
- TSUGIは**M&A仲介・M&Aコンサル・企業ドック診断・PMI**を明記（阿部さん指定）。
- デザインは写真の生成り背景に合わせ、生成り×墨×鳶色アクセントのエディトリアル。

## 仮置き（必要なら更新する箇所）
2026-06-22時点、阿部さん「めっちゃいい・採用」で**現状のまま公開・確定**。以下はネット情報ベースの仮置きで、精度を上げたくなったら差し替える:
- 経歴の年・年数（人材/採用10年以上 → 2018独立 → 2019.12バレンサー → 2025 TSUGI）
- 変革事例3枚は**社名を伏せ業種＋変革内容で抽象化**（実在案件の匿名化）。社名・成果数字を出すかは要判断。
- フッターの梅田住所の掲載可否。

## 関連
- 自己定義の正本: `docs/handoff/`（concept-summary.html）/ `docs/company/`
- 同型の単体Vercel公開の前例: `docs/clients/1stplace/README.md`
