---
name: dads
description: "デジタル庁デザインシステム（DADS v2）で資料・LP・Webページ・管理画面・フォームを作るスキル。公式のデザイントークン（色・タイポ・角丸・影）とコンポーネント仕様を実測値で保持し、そのまま静的HTML/ReactどちらでもDADS準拠の見た目を再現する。ユーザーが「デジタル庁のやつで作って」「デジタル庁のデザインシステム」「DADS」「デジタル庁風」「行政っぽく／公的な見た目で」「アクセシビリティ重視の堅い画面」等と言った時に使用。"
---

# デジタル庁デザインシステム（DADS）で作る

「デジタル庁のやつで作って」と言われたら、**このフォルダの実測トークンとコンポーネント仕様をそのまま適用**する。ネットを見に行かなくても、色・文字・部品の値はここに全部ある。

- 公式サイト: https://design.digital.go.jp/dads/
- React版Storybook: https://design.digital.go.jp/dads/react/
- HTML版Storybook: https://design.digital.go.jp/dads/html/
- ソース: [design-system-example-components-react](https://github.com/digital-go-jp/design-system-example-components-react)（MIT）
- **保持バージョン: design-tokens v2.0.1（Figma v2.0.4〜2.14.0 対応）／tailwind-theme-plugin v1.0.1。2026-08-17 取得**

## このフォルダの中身

| ファイル | 中身 | 使い方 |
|---|---|---|
| `reference/tokens.md` | トークン全量（10色相×13階調・タイポ58種・角丸・影8段） | 値を引く時に読む。**まずここ** |
| `assets/dads-tokens.css` | 公式 `tokens.css` をそのまま同梱（MIT） | CSS変数の実体。改変しない |
| `assets/dads-typography.css` | 公式タイポ55クラスを素のCSSに展開 | Tailwindなしの静的HTML用 |
| `assets/dads-components.css` | ボタン/リンク/フォーム/見出し/カード/表/通知を素のCSSに書き起こし | 静的HTML用のコンポーネント層 |
| `assets/starter.html` | 上3枚を読み込んだ雛形＋部品見本 | ここをコピーして作り始める |
| `assets/LICENSE-digital-agency.txt` | MITライセンス原文 | 納品物に同梱する時に使う |

## 作り方（3パターン）

### A. 静的HTML（LP・資料・1枚もの）← 通常はこれ
1. `assets/` の CSS 3枚 と `starter.html` を成果物フォルダにコピー。
2. `starter.html` の中身を差し替えて作る。読み込み順は **tokens → typography → components** で固定。
3. 1ファイルで完結させたい時（FTP公開・メール添付・Artifact）は3枚を連結して `<style>` に入れる:
   ```bash
   cat dads-tokens.css dads-typography.css dads-components.css > dads-all.css
   ```
4. フォントは Noto Sans JP（400/700）。外部読み込み不可の環境では `font-family` のフォールバックに任せる。

### B. React + Tailwind（アプリ・管理画面）
公式はnpm配布せず**コピー前提**。`npm i @digital-go-jp/tailwind-theme-plugin` を入れて `tailwind.config.js` の plugins に追加し、必要なコンポーネントを GitHub からコピーする（Tailwind v3 / React 18 想定）。依存する `Slot` や `parts/` も一緒に取ること。

### C. 見た目だけ真似る（スライド・図版・Figma）
`reference/tokens.md` の値を手で当てる。最低限これだけ守れば「デジタル庁っぽさ」は出る:
- キーカラー **#0017c1**（key-900）、本文 **#333333**、境界 **#666666**、背景は白
- Noto Sans JP、**ウェイトは400と700だけ**（500・600を使わない）
- 角丸は 4/6/8/12/16/24/32px のみ。ボタンは8px
- 影は原則使わない（使うなら elevation-1〜2 まで）

## 守るべき仕様（ここを外すと"それっぽいだけ"になる）

- **フォーカスリング**: 黒4pxのアウトライン＋2pxオフセット＋黄色(#ffd43d)2pxのリング。全インタラクティブ要素で共通。消さない
- **タップ領域44px**: ボタンsm/xsは見た目が小さくても擬似要素で44px確保する
- **ボタン3種**: solid-fill（主）／outline（副）／text（第3）。1画面に主ボタンは1つ
- **ボタンのhoverは下線が付く**。色変化だけに頼らない（色覚特性への配慮）
- **リンク**: #00118f・下線・オフセット3px、訪問済みはマゼンタ#8b008b、hoverで下線が3pxに太る
- **エラー**: 赤 #ec0000 の枠＋アイコン＋テキスト。色だけで伝えない
- **見出し**: 左のキーカラー縦棒（幅=1em/3）か下罫線のどちらか。両方は盛りすぎ
- コントラスト比 4.5:1 以上。トーンは中立・簡潔。装飾で情報を足さない

## 使いどころと線引き（バレンサーでの運用）

**向いている**: 申請フォーム・チェックリスト・業務マニュアル・管理画面・自治体/公共案件・「堅く・読みやすく・アクセシブルに」が求められる資料。補助金まわりの申請支援ページとも相性が良い。

**向いていない／注意**: バレンサー自社のブランド訴求物（LP・提案書・コーポレートサイト）。自社CIの正本（[BALENCER_DESIGN_SYSTEM.md](../../../docs/company/BALENCER_DESIGN_SYSTEM.md)・墨×コバルト#3158D4）が優先で、DADSはそれを上書きしない。どうしても混ぜる時は **キーカラーだけ自社色に差し替える**（`--color-key-*` を上書きすれば全体が追従する設計）。

**やらないこと**:
- デジタル庁のロゴ・シンボル・省庁名を使わない。**公的機関の制作物だと誤認させる見せ方をしない**（コードはMITだが、ブランドは別）
- 政府案件でない成果物に「デジタル庁準拠」と大書きしない。社内・クライアント説明で「デジタル庁デザインシステムをベースにした」程度に留める
- 既存の禁止事項はDADS適用時も勝つ: 蛍光イエローのマーカー風下線を使わない／全角ダブルクォート禁止／AIっぽい読点コピー禁止

## 関連スキル

- `design-md` … 「○○風で作って」のブランド指定。DADSはそのギャラリー外の独立テーマなので、**このスキルが優先**
- `brand-lint` … バレンサー名義の対外物は最後に通す
- 保存先はCLAUDE.md §3の箱に従う（顧客案件なら `docs/clients/<顧客>/`）

## バージョンを上げる時

```bash
npm pack @digital-go-jp/design-tokens          # 最新版を取得
npm pack @digital-go-jp/tailwind-theme-plugin
```
取り出した `dist/tokens.css` を `assets/dads-tokens.css` に上書きし、`reference/tokens.md` と `assets/dads-typography.css` を作り直す（生成スクリプトの内容は tokens.md 末尾に記載の手順どおり）。コンポーネント仕様が変わっていたら `assets/dads-components.css` も追随する。
