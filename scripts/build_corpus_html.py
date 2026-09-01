#!/usr/bin/env python3
"""docs/_corpus/ の4つのmdを1枚の閲覧用HTML（docs/_corpus/概要.html）に焼き直す。

使い方: python3 scripts/build_corpus_html.py
生声を回収してINDEX.mdを更新したら、必ずこれを実行してHTMLも合わせる（HTMLが古いと索引として嘘をつく）。
既存 概要.html の<head>（CSS）はそのまま使い、本文だけ差し替える。
"""
import re, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from md_to_html import convert

ROOT = Path(__file__).resolve().parent.parent
CORPUS = ROOT / "docs/_corpus"
OUT = CORPUS / "概要.html"
PARTS = [
    CORPUS / "README.md",
    CORPUS / "abe-voice/INDEX.md",
    CORPUS / "abe-voice/_odai-backlog.md",
    CORPUS / "abe-shiso/人生設計_思想の芯.md",
]

def main():
    head = re.split(r'<h1>肉声コーパス', OUT.read_text(encoding="utf-8"))[0]
    n = len(list((CORPUS / "abe-voice").glob("2026-*.md")))
    dates = sorted({p.name[:10] for p in (CORPUS / "abe-voice").glob("2026-*.md")})
    body = "\n<hr>\n".join(convert(p.read_text(encoding="utf-8")) for p in PARTS if p.exists())
    OUT.write_text(
        head
        + f'<h1>肉声コーパス — 設計と在庫</h1>\n'
        + f'<p class="meta">{dates[-1]} 更新 ／ docs/_corpus/ の全体像・生声{n}本の索引・お題の在庫・人生設計の思想の芯</p>\n'
        + body
        + "\n</div></body></html>\n",
        encoding="utf-8")
    print(f"→ {OUT}（生声{n}本）")

if __name__ == "__main__":
    main()
