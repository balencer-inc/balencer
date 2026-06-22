# イベント用 紹介ページ（2社：バレンサー / TSUGI＆PARTNERS）

対外イベントの場で、**繋いでくれる人（紹介者）が2社を理解して、いろんな人にアサイン（紹介）しやすくする**ための一枚もの紹介ページ。コーポレートサイトとは別建て・公式サイトには未反映。読み手の中心は**大手メーカー・中小企業の経営者**。

## 公開URL（Vercel）
- **本番: https://balencer-intro.vercel.app**
- Vercelプロジェクト名 `balencer-intro`（チーム tabe-balencerjps-projects）。**本番balencer(Next.js)とは別プロジェクト**＝公式サイトに影響なし。
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
