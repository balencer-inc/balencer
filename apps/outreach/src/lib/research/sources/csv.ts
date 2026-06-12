/**
 * CSV アップロード → Seed[] 変換
 *
 * 対応スキーマ:
 *   v1: company_name, url, industry?, area?, employee_hint?, note?
 *   v2: 上記 + contact_method?, contact_email?, contact_form_url?, domain_match?,
 *       safe?, safe_reason?, hook_source?, hook_quote?
 *
 * Phase 1: UTF-8 のみ対応（BOM 検出）。SJIS / Excel 出力は Phase 2。
 *
 * v2 では Claude Code 側（/outreach-list スキル）でリッチ化・safe判定済みの
 * CSV を受け取って、source_meta に詰めて後段（enrich.ts）に渡す。
 * safe=false の行は seeds から除外する（skippedRows 行きにする）。
 */

import Papa from "papaparse";
import { isBlockedUrl, normalizeHost } from "../urlValidator";

/** CSV パース結果の1行を表す seed (csv.ts内ローカル型) */
export interface Seed {
  company_name: string;
  url: string;
  data_source: "csv";
  source_meta: Record<string, unknown>;
}

export interface CsvParseResult {
  seeds: Seed[];
  skippedRows: Array<{ rowIndex: number; reason: string; raw: Record<string, string> }>;
  totalRows: number;
}

/**
 * CSV テキストをパース。BOM 自動除去、ヘッダ揺れ吸収（company_name / 社名 / company 等）。
 */
export function parseCsvText(csvText: string, sourceFilename = "uploaded.csv"): CsvParseResult {
  // BOM 除去
  const cleaned = csvText.replace(/^﻿/, "");

  const parsed = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeHeader,
  });

  const seeds: Seed[] = [];
  const skippedRows: Array<{ rowIndex: number; reason: string; raw: Record<string, string> }> = [];

  (parsed.data || []).forEach((row, idx) => {
    const company_name = (row.company_name || "").trim();
    const url = (row.url || "").trim();

    if (!company_name) {
      skippedRows.push({ rowIndex: idx + 2, reason: "社名が空", raw: row });
      return;
    }
    if (!url) {
      skippedRows.push({ rowIndex: idx + 2, reason: "URLが空", raw: row });
      return;
    }
    if (!/^https?:\/\//.test(url)) {
      skippedRows.push({ rowIndex: idx + 2, reason: "URLがhttp(s)で始まっていない", raw: row });
      return;
    }
    if (isBlockedUrl(url)) {
      skippedRows.push({ rowIndex: idx + 2, reason: "ブロックリスト掲載のドメイン", raw: row });
      return;
    }

    // v2: safe=false の行は弾く
    const safeRaw = (row.safe || "").trim().toLowerCase();
    if (safeRaw === "false") {
      const reason = row.safe_reason?.trim() || "safe=false";
      skippedRows.push({ rowIndex: idx + 2, reason: `スキル側で除外 (${reason})`, raw: row });
      return;
    }

    // v2: contact_method の正規化（email | form | both | none | unknown）
    const contactMethodRaw = (row.contact_method || "").trim().toLowerCase();
    const contactMethod = ["email", "form", "both", "none"].includes(contactMethodRaw)
      ? (contactMethodRaw as "email" | "form" | "both" | "none")
      : undefined;

    // contact_method=none も safeチェックで弾かれてなければここまで来るので念のため除外
    if (contactMethod === "none") {
      skippedRows.push({ rowIndex: idx + 2, reason: "connect_method=none（連絡導線なし）", raw: row });
      return;
    }

    seeds.push({
      company_name,
      url,
      data_source: "csv",
      source_meta: {
        filename: sourceFilename,
        row_index: idx + 2, // 1-indexed + ヘッダ行
        // v1 列
        industry: row.industry?.trim() || undefined,
        area: row.area?.trim() || undefined,
        employee_hint: row.employee_hint?.trim() || undefined,
        note: row.note?.trim() || undefined,
        // v2 列（Claude Code 側で前倒し判定済み）
        contact_method: contactMethod,
        contact_email: row.contact_email?.trim() || undefined,
        contact_form_url: row.contact_form_url?.trim() || undefined,
        domain_match: parseBoolean(row.domain_match),
        safe: parseBoolean(row.safe) ?? true, // safe 列が無ければ true 扱い（v1 互換）
        hook_source: row.hook_source?.trim() || undefined,
        hook_quote: row.hook_quote?.trim() || undefined,
      },
    });
  });

  return {
    seeds,
    skippedRows,
    totalRows: parsed.data.length,
  };
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return undefined;
}

/**
 * ヘッダ正規化: 全角・大文字小文字・揺れを吸収
 */
function normalizeHeader(header: string): string {
  const lower = header.trim().toLowerCase();
  const map: Record<string, string> = {
    // v1 列
    company_name: "company_name",
    "company name": "company_name",
    company: "company_name",
    社名: "company_name",
    会社名: "company_name",
    法人名: "company_name",
    name: "company_name",
    url: "url",
    "web site": "url",
    website: "url",
    site: "url",
    hp: "url",
    "公式url": "url",
    industry: "industry",
    業種: "industry",
    area: "area",
    エリア: "area",
    地域: "area",
    都道府県: "area",
    prefecture: "area",
    employee: "employee_hint",
    employees: "employee_hint",
    employee_hint: "employee_hint",
    社員数: "employee_hint",
    従業員数: "employee_hint",
    note: "note",
    memo: "note",
    備考: "note",
    メモ: "note",
    // v2 列
    contact_method: "contact_method",
    contact_email: "contact_email",
    email: "contact_email",
    メアド: "contact_email",
    メールアドレス: "contact_email",
    contact_form_url: "contact_form_url",
    form_url: "contact_form_url",
    フォームurl: "contact_form_url",
    domain_match: "domain_match",
    safe: "safe",
    safe_reason: "safe_reason",
    除外理由: "safe_reason",
    hook_source: "hook_source",
    hook_url: "hook_source",
    フック根拠: "hook_source",
    hook_quote: "hook_quote",
    フック引用: "hook_quote",
  };
  return map[lower] || lower;
}

/**
 * Seed 配列内の重複（同じホスト名）を除去
 */
export function dedupeSeedsByHost(seeds: Seed[]): Seed[] {
  const seen = new Set<string>();
  const unique: Seed[] = [];
  for (const s of seeds) {
    const host = normalizeHost(s.url);
    if (!host) continue;
    if (seen.has(host)) continue;
    seen.add(host);
    unique.push(s);
  }
  return unique;
}
