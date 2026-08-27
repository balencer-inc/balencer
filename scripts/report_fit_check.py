#!/usr/bin/env python3
"""A4横1枚レポートの「はみ出し」を自動検査する。

.page を height:210mm; overflow:hidden で組んだ1枚レポートは、
中身がはみ出していても1ページのPDFができてしまい、目視でしか気づけない。

このスクリプトは .page の高さ制約を一時的に外したコピーをPDF化し、
ページ数が1を超えたら「はみ出している」と判定する。

使い方:
    python3 scripts/report_fit_check.py <HTMLパス> [...]

終了コード: 0 = 全部1枚に収まっている / 1 = はみ出しあり
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# .page の高さ固定と overflow:hidden を打ち消す。実ファイルは書き換えない
UNLOCK_CSS = """
<style id="fit-check-unlock">
  .page{height:auto !important;min-height:0 !important;overflow:visible !important;}
</style>
"""


def count_pdf_pages(pdf_path):
    data = open(pdf_path, "rb").read()
    n = len(re.findall(rb"/Type\s*/Page[^s]", data))
    return n if n else len(re.findall(rb"/Count\s+(\d+)", data)[:1] or [0])


def print_to_pdf(html_path, pdf_path):
    subprocess.run(
        [CHROME, "--headless", f"--print-to-pdf={pdf_path}",
         "--no-pdf-header-footer", html_path],
        capture_output=True, check=True,
    )


def check(html_path):
    """(収まっているか, 解放時のページ数) を返す"""
    src = open(html_path, encoding="utf-8").read()
    if "</head>" not in src:
        raise ValueError("</head> が見つかりません")
    unlocked = src.replace("</head>", UNLOCK_CSS + "</head>", 1)

    workdir = tempfile.mkdtemp(prefix="fitcheck-")
    try:
        # 相対パスの画像・CSSを解決できるよう、元と同じ階層に置く
        tmp_html = os.path.join(os.path.dirname(os.path.abspath(html_path)),
                                ".fit-check-tmp.html")
        open(tmp_html, "w", encoding="utf-8").write(unlocked)
        tmp_pdf = os.path.join(workdir, "out.pdf")
        try:
            print_to_pdf(tmp_html, tmp_pdf)
            pages = count_pdf_pages(tmp_pdf)
        finally:
            os.path.exists(tmp_html) and os.remove(tmp_html)
    finally:
        shutil.rmtree(workdir, ignore_errors=True)

    return pages <= 1, pages


def main(paths):
    if not os.path.exists(CHROME):
        print(f"[ERROR] Chrome が見つかりません: {CHROME}")
        return 1
    bad = 0
    for p in paths:
        if not os.path.exists(p):
            print(f"[ERROR] ファイルがありません: {p}")
            bad += 1
            continue
        ok, pages = check(p)
        if ok:
            print(f"[OK]   1枚に収まっています: {p}")
        else:
            bad += 1
            print(f"[NG]   はみ出しています（解放すると{pages}ページ分）: {p}")
            print("       詰める順番: カード内の文量 → 項目数 → font-size/line-height → ヘッダー")
    print(f"\n合計: {len(paths)}件中 NG {bad}件")
    return 1 if bad else 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1:]))
