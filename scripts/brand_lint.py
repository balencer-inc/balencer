#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
brand_lint.py — バレンサー対外文書の自動検品スクリプト

CLAUDE.md 1章「やらないこと・使わない言葉」と、これまでの修正学習
（全角ダブルクォート禁止・AI読点コピー禁止・実績数字の正 など）を
機械チェックに落としたもの。LP・提案書・SNS下書き・note・スライド原稿を
公開/送付する前に必ず通す。

使い方:
    python3 scripts/brand_lint.py <ファイル...>          # 通常文書モード
    python3 scripts/brand_lint.py --sns <ファイル...>    # SNS下書きモード（追加ルール適用）

終了コード: 0=問題なし / 1=ERRORあり / 2=使い方エラー
"""

import re
import sys
import unicodedata

# ---------------------------------------------------------------
# ルール定義
# level: "ERROR"(対外に出してはいけない) / "WARN"(目視確認が必要)
# ---------------------------------------------------------------

# 旧ブランド表現（CLAUDE.md 1章で使用禁止と明記）
FORBIDDEN_PHRASES = [
    ("デザインコンサルティングカンパニー", "旧表現。現在は「ブランディングAXカンパニー」"),
    ("経営者の右腕を外注", "旧表現。右腕は外注ではなく「経営者の右腕がつとまる」"),
    ("サービス3カテゴリ", "旧表現。現在は ENTRANCE/CORE/PROJECT/SUMMIT の階段"),
    ("Entryプラン", "旧表現。現在の入口は SOERU（月10万/20万）"),
    ("AI顧問", "旧表現。SOERU＝AI顧問という説明は使わない"),
    ("1000社", "実績数字の正は「64社・生涯4.03億」。出どころ曖昧な数字は使わない"),
    ("オフショア300名", "旧表現。現在の体制説明は「少数精鋭×AI組織」"),
]

# 「対話もできて、コードも書ける」型・掛け算コピー（対外文書で使わない）
INTERNAL_ONLY_PATTERNS = [
    (re.compile(r"対話もできて、?コードも書ける"), "「対話もできて、コードも書ける」型コピーは対外文書で使わない（社内の構造説明用）"),
    (re.compile(r"[一-龠ぁ-んァ-ン]力\s*[×✕✖]\s*[一-龠ぁ-んァ-ン]"), "「〜力×〜力」掛け算コピーは対外文書で使わない（社内の構造説明用）"),
]

# 全角/スマートダブルクォート（AIっぽさの代表。「」か無しにする）
CURLY_QUOTES = re.compile(r"[“”]")

# AI読点コピー「〜に、〜を。」型（短句+に、+短句+を。）
AI_PUNCT_COPY = re.compile(r"[^、。\n]{1,14}に、[^、。\n]{1,14}を。")

# 実績数字らしき「N社」表記（64社以外は要確認）。範囲表記「6〜10社」等は除外
COMPANY_COUNT = re.compile(r"(?<![\d〜~\-])(\d{2,4})社")

# SNSモード: ハッシュタグ
HASHTAG = re.compile(r"(?:^|\s)[#＃][^\s#＃]+")

# SNSモード: 問いかけ連続（？で終わる文が2つ以上連続）
CONSECUTIVE_QUESTIONS = re.compile(r"[^？?。\n]+[？?]\s*[^？?。\n]+[？?]")

# 見出し（タイトル/キャッチ）検出。HTMLの h1〜h3 と Markdown の #〜###
HTML_HEADING = re.compile(r"<h[1-3][^>]*>(.*?)</h[1-3]>", re.I)
MD_HEADING = re.compile(r"^\s{0,3}#{1,3}\s+(.*\S)")
TAG_STRIP = re.compile(r"<[^>]+>")

# 見出しの一部だけ黄色ハイライト/下線を当てる部分強調（タイトルでは使わない）
# ＝見出し要素の内側に hl クラスや黄色の linear-gradient がある状態
PARTIAL_HL = re.compile(r"""class=["']hl["']|linear-gradient\([^)]*(?:var\(--yellow|rgba\(\s*230)""", re.I)

# 対外文書の敬称：クライアント名は「さん」でなく「様」。たくさん/みなさん/皆さん等は除外
HONORIFIC_SAN = re.compile(r"(?<!たく)(?<!みな)(?<!皆)さん")


def normalize(line: str) -> str:
    """NFKC正規化はせず原文のまま扱う（全角検出のため）。前後空白のみ除去。"""
    return line.rstrip("\n")


def lint_file(path: str, sns_mode: bool):
    findings = []
    try:
        with open(path, encoding="utf-8") as f:
            lines = f.readlines()
    except FileNotFoundError:
        return None
    except UnicodeDecodeError:
        findings.append((0, "ERROR", "UTF-8で読めないファイル。文字コードを確認", ""))
        return findings

    for i, raw in enumerate(lines, 1):
        line = normalize(raw)
        stripped = line.strip()
        if not stripped:
            continue
        # HTMLのタグ属性行やコードブロックの機械的な誤検知を減らす:
        # ただし表示テキストに出る違反を見逃さないよう、スキップはしない（WARNで目視）。

        for phrase, why in FORBIDDEN_PHRASES:
            if phrase in line:
                findings.append((i, "ERROR", f"禁止表現「{phrase}」: {why}", stripped))

        for pat, why in INTERNAL_ONLY_PATTERNS:
            if pat.search(line):
                findings.append((i, "ERROR", why, stripped))

        if CURLY_QUOTES.search(line):
            findings.append((i, "ERROR", "全角ダブルクォート“”は使わない。「」に置換するか外す", stripped))

        if AI_PUNCT_COPY.search(line):
            findings.append((i, "WARN", "「〜に、〜を。」型のAI読点コピーの疑い。読点なしで言い切れないか確認", stripped))

        for m in COMPANY_COUNT.finditer(line):
            # 禁止表現(1000社)側で既にERROR報告済みのものは二重報告しない
            if m.group(1) != "64" and m.group(0) not in [p for p, _ in FORBIDDEN_PHRASES]:
                findings.append((i, "WARN", f"実績数字らしき「{m.group(0)}」。正は64社・生涯4.03億。出どころを確認", stripped))

        # 見出し（タイトル/キャッチ）の表記ルール
        for hm in HTML_HEADING.finditer(line):
            inner = hm.group(1)
            if PARTIAL_HL.search(inner):
                findings.append((i, "WARN", "見出しの一部だけ黄色ハイライト/下線を当てている疑い。タイトルは部分強調しない（外すか全体で統一）", stripped))
            if "、" in TAG_STRIP.sub("", inner):
                findings.append((i, "WARN", "タイトル/キャッチコピーに読点「、」を入れない。改行・句点・スペースで区切る", stripped))
        mdh = MD_HEADING.match(line)
        if mdh and "、" in mdh.group(1):
            findings.append((i, "WARN", "タイトル/キャッチコピー（見出し）に読点「、」を入れない。改行・句点・スペースで区切る", stripped))

        # 対外文書の敬称：クライアント名は「様」
        if HONORIFIC_SAN.search(line):
            findings.append((i, "WARN", "対外文書の敬称は「様」。クライアント名が「さん」になっていないか確認", stripped))

        if sns_mode:
            if HASHTAG.search(line):
                findings.append((i, "ERROR", "SNS投稿にハッシュタグは付けない", stripped))
            if CONSECUTIVE_QUESTIONS.search(line):
                findings.append((i, "WARN", "問いかけの連続の疑い。問いかけは1回まで", stripped))

    return findings


def main(argv):
    args = [a for a in argv[1:] if a != "--sns"]
    sns_mode = "--sns" in argv[1:]
    if not args:
        print(__doc__)
        return 2

    total_err = total_warn = checked = 0
    for path in args:
        findings = lint_file(path, sns_mode)
        if findings is None:
            print(f"[SKIP] {path}: ファイルが見つかりません")
            continue
        checked += 1
        if not findings:
            print(f"[OK]   {path}: 問題なし")
            continue
        print(f"[NG]   {path}: {len(findings)}件")
        for lineno, level, msg, text in findings:
            preview = text if len(text) <= 60 else text[:57] + "..."
            print(f"  L{lineno} {level}: {msg}")
            if preview:
                print(f"        > {preview}")
            if level == "ERROR":
                total_err += 1
            else:
                total_warn += 1

    print()
    if checked == 0:
        print("検査できたファイルが0件。パスを確認してください")
        return 2
    print(f"合計: ERROR {total_err}件 / WARN {total_warn}件"
          + ("（WARNは目視確認のうえ判断）" if total_warn else ""))
    return 1 if total_err else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
