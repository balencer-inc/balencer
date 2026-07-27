# 06_チーム共有 — Clavis Partners 案件ドシエ

チームで案件を引き継いで進めるための、社内共有用まとめ。**Claudeプロジェクトのナレッジ**または壁打ちチャットに貼って使う。

## 成果物
- **Clavis_Partners_案件ドシエ_社内共有_2026-07-27.pdf**（51ページ・社外秘）
  - 前半（p1〜13）＝バレンサー整理パート：表紙／使い方・目次／案件サマリ／経緯①引き継ぎメモ(7/8)／経緯②議事録(7/14・契約締結)／最新①戦略ロードマップ／最新②取り組み具体案
  - 後半（p14〜51）＝原本添付：初回議事録(7/7)／Clavis会社紹介／支援実績・事例集／プロフィール／契約書
  - ※アップロード用に `~/Desktop/` にも同じPDFをコピー済み

## Claudeプロジェクトでの使い方
1. claude.ai/Desktop で Clavis Partners 用のプロジェクトを作る（例「Clavis Partners 案件」）
2. このPDFをそのプロジェクトのナレッジにアップロード
3. 会社の記憶（バレンサー自体の前提）は別途「バレンサー会社の記憶」プロジェクト or `docs/company/_project-bundle.md` を参照（CLAUDE.md §6）

## 更新のしかた（低頻度）
整理パートを直したいとき：
1. `_dossier_build.html` を編集
2. Chrome headless でPDF化 → 既存PDFと `pdfunite` で結合（手順は下記）

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE="docs/clients/clavis-partners"; OUT="$BASE/06_チーム共有"
"$CHROME" --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$OUT/_part_narrative.pdf" "file://$PWD/$OUT/_dossier_build.html"
pdfunite "$OUT/_part_narrative.pdf" \
  "$BASE/03_議事録/初回お打ち合わせオンライン (杉山康之) - 2026_07_07 08_56 JST - Gemini によるメモ.pdf" \
  "$BASE/05_素材/株式会社Clavis Partners｜会社・事業紹介資料(1020).pdf" \
  "$BASE/05_素材/株式会社Clavic Partners｜支援実績・事例集.pdf" \
  "$BASE/05_素材/プロファイル_sugiyama.pdf" \
  "$BASE/02_契約・見積/コンサルティング業務委託契約書_ClavisPartners.pdf" \
  "$OUT/Clavis_Partners_案件ドシエ_社内共有_2026-07-27.pdf"
rm -f "$OUT/_part_narrative.pdf"
```

> 統合PDF本体はgitにコミットせず、生成物として扱う（原本PDFは既にリポジトリにあり重複を避けるため）。配布はデスクトップコピー→Claudeプロジェクトへアップロードで完結。案件の最新の詳細は `../README.md` が正本。
