#!/usr/bin/env python3
"""社内メモ・クライアント向けmdを、バレンサーのトーンで1枚のHTMLに変換する。

使い方: python3 scripts/md_to_html.py <input.md> [output.html]
出力しないHTMLは入力と同じ場所に同名で作る。印刷でA4に収まる。
対応記法: 見出し / 段落 / 箇条書き / 番号付き / チェックボックス / 表 / 水平線 / **強調** / [リンク](url) / > 引用
"""
import re, sys, html
from pathlib import Path

CSS = """
:root{--white:#FFFFFF;--cool:#F7F8F9;--pale:#F0F2F4;--ink:#45484D;--mid:#7A7E85;--line:#D9DCE1;--blue:#3158D4;}
*{box-sizing:border-box;}
body{margin:0;background:var(--pale);color:var(--ink);
font-family:"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans JP",sans-serif;
font-feature-settings:"palt";line-height:1.9;font-size:15px;-webkit-font-smoothing:antialiased;}
.sheet{max-width:880px;margin:48px auto;background:var(--white);padding:64px 72px 80px;}
h1{font-size:27px;line-height:1.5;font-weight:700;letter-spacing:.02em;margin:0 0 24px;padding-bottom:22px;border-bottom:2px solid var(--ink);}
h2{font-size:19px;font-weight:700;margin:56px 0 18px;letter-spacing:.02em;padding-left:14px;border-left:3px solid var(--blue);}
h3{font-size:15.5px;font-weight:700;margin:34px 0 10px;color:var(--blue);letter-spacing:.02em;}
p{margin:0 0 14px;}
hr{border:0;border-top:1px solid var(--line);margin:44px 0;}
a{color:var(--blue);}
blockquote{margin:16px 0 20px;padding:14px 20px;background:var(--cool);border-left:3px solid var(--line);color:var(--ink);}
blockquote p:last-child{margin-bottom:0;}
ul,ol{margin:0 0 16px;padding-left:1.4em;}
li{margin-bottom:7px;}
ul.todolist{list-style:none;padding-left:0;}
li.todo{padding-left:30px;position:relative;}
li.todo:before{content:"";position:absolute;left:2px;top:.55em;width:13px;height:13px;border:1.5px solid var(--mid);border-radius:2px;}
.tablewrap{overflow-x:auto;margin:18px 0 24px;}
table{width:100%;border-collapse:collapse;font-size:14px;}
th{background:var(--cool);text-align:left;font-weight:700;padding:11px 14px;border-bottom:1.5px solid var(--ink);white-space:nowrap;}
td{padding:11px 14px;border-bottom:1px solid var(--line);vertical-align:top;}
@media print{body{background:#fff;}.sheet{margin:0;padding:20mm 18mm;max-width:none;}h2{page-break-after:avoid;}table{page-break-inside:avoid;}}
@media (max-width:720px){.sheet{margin:0;padding:32px 22px;}h1{font-size:22px;}th{white-space:normal;}}
"""

def inline(t):
    t = html.escape(t)
    t = re.sub(r'\[(.+?)\]\((.+?)\)', r'<a href="\2">\1</a>', t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    return t

def convert(md):
    lines = md.split("\n"); body = []; i = 0
    while i < len(lines):
        s = lines[i].strip()
        if not s:
            i += 1; continue
        if s == "---":
            body.append("<hr>"); i += 1; continue
        if s.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")]); i += 1
            head, data = rows[0], rows[2:]
            t = ['<div class="tablewrap"><table><thead><tr>' + "".join(f"<th>{inline(c)}</th>" for c in head) + "</tr></thead><tbody>"]
            for r in data:
                t.append("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>")
            body.append("".join(t) + "</tbody></table></div>"); continue
        if s.startswith(">"):
            buf = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                buf.append(lines[i].strip().lstrip(">").strip()); i += 1
            body.append("<blockquote>" + "".join(f"<p>{inline(b)}</p>" for b in buf if b) + "</blockquote>"); continue
        m = re.match(r"^(#{1,6})\s+(.*)$", s)
        if m:
            lv = len(m.group(1)); body.append(f"<h{lv}>{inline(m.group(2))}</h{lv}>"); i += 1; continue
        if s.startswith("- [ ]") or s.startswith("- [x]"):
            items = []
            while i < len(lines) and re.match(r"^- \[[ x]\]", lines[i].strip()):
                items.append(f'<li class="todo">{inline(lines[i].strip()[5:].strip())}</li>'); i += 1
            body.append('<ul class="todolist">' + "".join(items) + "</ul>"); continue
        if s.startswith("- "):
            items = []
            while i < len(lines) and lines[i].strip().startswith("- ") and not re.match(r"^- \[[ x]\]", lines[i].strip()):
                items.append(f"<li>{inline(lines[i].strip()[2:])}</li>"); i += 1
            body.append("<ul>" + "".join(items) + "</ul>"); continue
        if re.match(r"^\d+\.\s", s):
            items = []
            while i < len(lines) and re.match(r"^\d+\.\s", lines[i].strip()):
                items.append(f'<li>{inline(re.sub(r"^\d+\.\s", "", lines[i].strip()))}</li>'); i += 1
            body.append("<ol>" + "".join(items) + "</ol>"); continue
        body.append(f"<p>{inline(s)}</p>"); i += 1
    return "\n".join(body)

def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    src = Path(sys.argv[1])
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else src.with_suffix(".html")
    md = src.read_text(encoding="utf-8")
    m = re.search(r"^#\s+(.*)$", md, re.M)
    title = m.group(1) if m else src.stem
    dst.write_text(f"""<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title>
<style>{CSS}</style></head><body>
<div class="sheet">
{convert(md)}
</div></body></html>""", encoding="utf-8")
    print(f"→ {dst}")

if __name__ == "__main__":
    main()
