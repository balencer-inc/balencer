#!/usr/bin/env python3
"""税理士への月次提出: カード明細PDF × 領収書画像 の突合表を作る（PoC）

使い方:
    python3 scripts/zeirishi_matching.py docs/accounting/zeirishi-monthly/2026-08

前提:
    <月次フォルダ>/カード明細/*.pdf   セゾンのご利用明細書（Web明細のPDF。pdftotextで読める）
    <月次フォルダ>/領収書/YYYYMMDD_<支払先>_<金額>円_<カード|現金>.jpg

出力:
    <月次フォルダ>/突合表.csv     税理士へ渡す用（3色分類つき）
    <月次フォルダ>/突合表.html    画面で見る用（蛍光ペンの色分けを再現）

3色分類（紙の蛍光ペン運用をそのまま移したもの）:
    あり   … 明細行に対応する領収書画像がある
    なし   … 領収書が見つかっていない。要対応
    その他 … 領収書が構造的に出ない支出（サブスク・固定費・公共交通）。候補判定なので要確認
"""
import csv, html, re, subprocess, sys, unicodedata
from pathlib import Path

# 領収書が構造的に出ない（＝紙で集めようがない）支出のパターン。→「その他」候補
OTHER_PATTERNS = [
    (r"NOTION LABS|OPENAI|ANTHROPIC|GOOGLE ?\*|GOOGLE\*|CHATWORK|SLACK|MEILISEARCH|UTAGE|Apple iTunes",
     "サブスク・クラウド（Web領収書をDL可）"),
    (r"ドコモご利用料金", "通信固定費（Web明細）"),
    (r"モバイルSuica|スマートEX|GOアプリ|駐車場", "公共交通・移動（インボイス特例の対象になりうる）"),
]

def norm(s: str) -> str:
    """突合用の正規化。全角/半角・空白・記号・大小文字の差を吸収する"""
    s = unicodedata.normalize("NFKC", s).upper()
    return re.sub(r"[\s\-‐－_*.,、。〔〕（）()／/]", "", s)

def parse_statement(pdf: Path):
    txt = subprocess.run(["pdftotext", "-layout", str(pdf), "-"],
                         capture_output=True, text=True, check=True).stdout
    billed = None
    m = re.search(r"ご請求金額\s+([\d,]+)円", txt)
    if m:
        billed = int(m.group(1).replace(",", ""))
    rows = []
    for line in txt.splitlines():
        m = re.match(r"^((?:\d\s+){7}\d)\s+(.*)$", line)
        if not m:
            continue
        date = re.sub(r"\s", "", m.group(1))
        m2 = re.match(r"^(.*?)\s+(1\s+)?(1回|2回|リボ|ボーナス)\s+(-?\d+)\s*(.*)$", m.group(2).strip())
        if not m2:
            print(f"  ! 解析できない行: {line.strip()}", file=sys.stderr)
            continue
        rows.append({
            "利用日": f"{date[:4]}-{date[4:6]}-{date[6:8]}",
            "店名": m2.group(1).strip(),
            "カード": "家族" if m2.group(2) else "本人",
            "支払区分": m2.group(3),
            "金額": int(m2.group(4)),
            "明細備考": m2.group(5).strip(),
        })
    return rows, billed

def parse_receipts(folder: Path):
    out = []
    for p in sorted(folder.glob("*")):
        if p.suffix.lower() not in (".jpg", ".jpeg", ".png", ".pdf", ".heic"):
            continue
        m = re.match(r"^(\d{8})_(.+?)_(\d+)円_(カード|現金)$", p.stem)
        if not m:
            print(f"  ! 命名規則に合わないファイル: {p.name}", file=sys.stderr)
            continue
        d, payee, amt, method = m.groups()
        out.append({"日付": f"{d[:4]}-{d[4:6]}-{d[6:8]}", "支払先": payee,
                    "金額": int(amt), "支払方法": method, "ファイル": p.name})
    return out

def classify_other(store: str):
    for pat, reason in OTHER_PATTERNS:
        if re.search(pat, store, re.I):
            return reason
    return None

def match(stmt_rows, receipts):
    unused = list(receipts)
    for r in stmt_rows:
        hit = None
        # 1st: 金額一致 かつ 店名が部分一致（正規化後）
        for rc in unused:
            if rc["金額"] == r["金額"] and (norm(rc["支払先"]) in norm(r["店名"])
                                          or norm(r["店名"]) in norm(rc["支払先"])):
                hit = rc
                break
        # 2nd: 金額一致 かつ 日付一致（店名表記が全く違うケースの救済）
        if not hit:
            for rc in unused:
                if rc["金額"] == r["金額"] and rc["日付"] == r["利用日"]:
                    hit = rc
                    break
        if hit:
            unused.remove(hit)
            r["区分"], r["領収書"], r["判定理由"] = "あり", hit["ファイル"], "金額＋店名/日付が一致"
        else:
            reason = classify_other(r["店名"])
            if reason:
                r["区分"], r["領収書"], r["判定理由"] = "その他", "", reason
            else:
                r["区分"], r["領収書"], r["判定理由"] = "なし", "", "対応する領収書が未提出"
    return stmt_rows, unused

COLORS = {"あり": "#dff3e4", "なし": "#ffe0e0", "その他": "#e6ecf7"}

def write_html(path: Path, rows, unused, billed, total, pdf_name):
    def tr(r):
        return ("<tr style=\"background:%s\"><td>%s</td><td>%s</td><td class=n>%s</td>"
                "<td>%s</td><td><b>%s</b></td><td>%s</td><td>%s</td></tr>") % (
            COLORS[r["区分"]], r["利用日"], html.escape(r["店名"]), f"{r['金額']:,}",
            r["カード"], r["区分"], html.escape(r["領収書"]), html.escape(r["判定理由"]))
    counts = {k: sum(1 for r in rows if r["区分"] == k) for k in COLORS}
    left = "".join(
        f"<li>{html.escape(u['ファイル'])}（{u['日付']}／{u['金額']:,}円）</li>" for u in unused
    ) or "<li>なし</li>"
    check = "一致" if billed == total else f"不一致（差 {total - (billed or 0):,}円）"
    path.write_text(f"""<meta charset="utf-8"><title>突合表 {path.parent.name}</title>
<style>
body{{font-family:-apple-system,"Hiragino Sans",sans-serif;margin:32px;color:#1a1a1a;font-size:13px}}
h1{{font-size:20px;margin:0 0 4px}} .sub{{color:#666;margin-bottom:20px}}
table{{border-collapse:collapse;width:100%}} th,td{{border:1px solid #d8d8d8;padding:5px 8px;text-align:left}}
th{{background:#f4f4f4;font-weight:600}} .n{{text-align:right;font-variant-numeric:tabular-nums}}
.legend span{{display:inline-block;padding:3px 10px;margin-right:8px;border:1px solid #ccc}}
.box{{background:#fafafa;border:1px solid #e0e0e0;padding:12px 16px;margin:16px 0}}
</style>
<h1>カード明細 × 領収書 突合表</h1>
<div class="sub">{path.parent.name} 提出分／明細: {html.escape(pdf_name)}</div>
<div class="box">
 <b>検算</b>: 明細{len(rows)}件の合計 {total:,}円 ／ 明細記載のご請求金額 {billed:,}円 → <b>{check}</b><br>
 <b>内訳</b>: あり {counts['あり']}件 ／ なし {counts['なし']}件 ／ その他 {counts['その他']}件
</div>
<div class="legend">
 <span style="background:{COLORS['あり']}">あり = 領収書あり</span>
 <span style="background:{COLORS['なし']}">なし = 領収書なし（要対応）</span>
 <span style="background:{COLORS['その他']}">その他 = 領収書が出ない支出（候補判定・要確認）</span>
</div>
<table><tr><th>利用日</th><th>ご利用店名</th><th>金額</th><th>カード</th><th>区分</th><th>領収書ファイル</th><th>判定理由</th></tr>
{"".join(tr(r) for r in rows)}</table>
<div class="box"><b>この明細に載っていない領収書</b>（＝締め期間の外。次回提出分に回る）<ul>{left}</ul></div>
""", encoding="utf-8")

def main():
    base = Path(sys.argv[1])
    pdf = next(iter(sorted((base / "カード明細").glob("*.pdf"))), None)
    if not pdf:
        sys.exit(f"カード明細PDFが見つかりません: {base/'カード明細'}")
    stmt, billed = parse_statement(pdf)
    receipts = parse_receipts(base / "領収書")
    rows, unused = match(stmt, receipts)
    total = sum(r["金額"] for r in rows)

    cols = ["利用日", "店名", "金額", "カード", "支払区分", "区分", "領収書", "判定理由", "明細備考"]
    with (base / "突合表.csv").open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader(); w.writerows(rows)
    write_html(base / "突合表.html", rows, unused, billed, total, pdf.name)

    print(f"明細: {len(rows)}件 / 合計 {total:,}円 / ご請求金額 {billed:,}円 → "
          f"{'検算一致' if billed == total else '★検算不一致'}")
    for k in COLORS:
        print(f"  {k}: {sum(1 for r in rows if r['区分']==k)}件")
    print(f"  この明細の締め期間外の領収書: {len(unused)}枚")
    print(f"出力: {base/'突合表.csv'} / {base/'突合表.html'}")

if __name__ == "__main__":
    main()
