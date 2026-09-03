#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""請求書の検算（税抜換算・税率別集計・契約総額との突合）。

使い方:
    python3 .claude/skills/invoice/scripts/invoice_calc.py <明細JSON> [--csv 出力先.csv]

明細JSONの形（例は assets/sample-items.json）:
{
  "to": "株式会社ファイアープレイス",
  "no": "07-079",
  "date": "2026-09-03",
  "due": "2026-09-30",
  "expected_total_incl": 374200,      # 契約・合意ベースの税込総額（任意・突合用）
  "items": [
    {"name": "OSAKA共創LAB ファシリテーター業務委託費", "detail": "8月分",
     "amount": 300000, "basis": "incl", "rate": 10}
  ]
}

- basis: "incl"（金額が税込）/ "excl"（金額が税抜）
- rate : 10 / 8（軽減税率）
- 税抜換算は行ごとに round()、消費税は税率ごとの小計に対して1回だけ floor。
  （インボイス制度: 端数処理は税率ごとに1回）
"""
import csv
import json
import sys
from math import floor

def to_excl(amount: int, basis: str, rate: int) -> int:
    if basis == "excl":
        return int(amount)
    if basis != "incl":
        raise ValueError(f"basis は incl / excl のみ: {basis}")
    return int(round(amount / (1 + rate / 100)))

def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    with open(sys.argv[1], encoding="utf-8") as f:
        data = json.load(f)

    items = data.get("items", [])
    if not items:
        print("明細が空です")
        return 1

    rows, subtotal = [], {10: 0, 8: 0}
    for it in items:
        rate = int(it.get("rate", 10))
        if rate not in subtotal:
            raise ValueError(f"税率は 10 か 8 のみ: {rate}")
        basis = it.get("basis", "excl")
        amount = int(it["amount"])
        excl = to_excl(amount, basis, rate)
        subtotal[rate] += excl
        rows.append({
            "商品": it["name"], "詳細": it.get("detail", ""),
            "税率": f"{rate}%", "金額（税抜）": excl,
            "原単価": amount, "基準": "税込" if basis == "incl" else "税抜",
        })

    tax = {r: floor(subtotal[r] * r / 100) for r in subtotal}
    total = sum(subtotal.values()) + sum(tax.values())

    w = 34
    print("=" * 52)
    print(f"請求書 検算　No {data.get('no', '(未採番)')}　{data.get('to', '')}")
    print("=" * 52)
    for r in rows:
        src = f"（{r['基準']} {r['原単価']:,}）" if r["基準"] == "税込" else ""
        print(f"  {r['商品'][:22]:<24}{r['詳細']:<6}{r['金額（税抜）']:>10,} {src}")
    print("-" * 52)
    for r in (10, 8):
        if subtotal[r] or r == 10:
            print(f"  {'小計（' + str(r) + '%対象）':<{w}}{subtotal[r]:>12,}")
    for r in (10, 8):
        if subtotal[r] or r == 10:
            print(f"  {'消費税（' + str(r) + '%対象）':<{w}}{tax[r]:>12,}")
    print(f"  {'合計金額（税込）':<{w}}{total:>12,}")
    print("-" * 52)

    exp = data.get("expected_total_incl")
    ok = True
    if exp is not None:
        diff = total - int(exp)
        mark = "OK" if diff == 0 else f"NG（差 {diff:+,}）"
        print(f"  契約・合意ベース税込総額 {int(exp):,} との突合: {mark}")
        ok = diff == 0
        if diff:
            print("  → 税抜換算の丸め方（round/floor）と行の分け方を見直す")

    # インボイス要件の機械チェック
    need = {"to": "宛名", "no": "請求書番号", "date": "取引年月日（作成日）"}
    miss = [lbl for k, lbl in need.items() if not data.get(k)]
    if miss:
        print("  ⚠ 未設定: " + " / ".join(miss))
        ok = False
    print("=" * 52)

    out = None
    for i, a in enumerate(sys.argv):
        if a == "--csv" and i + 1 < len(sys.argv):
            out = sys.argv[i + 1]
    if out:
        with open(out, "w", encoding="utf-8", newline="") as f:
            wr = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            wr.writeheader()
            wr.writerows(rows)
            wr.writerow({"商品": "小計（10%対象）", "金額（税抜）": subtotal[10]})
            if subtotal[8]:
                wr.writerow({"商品": "小計（8%対象）", "金額（税抜）": subtotal[8]})
            wr.writerow({"商品": "消費税（10%対象）", "金額（税抜）": tax[10]})
            if subtotal[8]:
                wr.writerow({"商品": "消費税（8%対象）", "金額（税抜）": tax[8]})
            wr.writerow({"商品": "合計金額（税込）", "金額（税抜）": total})
        print(f"CSV: {out}")

    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main())
