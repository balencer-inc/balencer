/**
 * CSV エクスポートのユーティリティ。
 * - CSV インジェクション対策（= + - @ で始まるセルに ' を前置）
 * - 改行・カンマ・ダブルクォートのエスケープ
 */

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  // セル先頭が = / + / - / @ の場合は ' を付けてフォーミュラ実行を防ぐ
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  // ダブルクォート/カンマ/改行があれば全体をクォート
  if (/["\n\r,]/.test(s)) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function rowsToCsv(headers: string[], rows: Array<Record<string, unknown>>): string {
  const headerLine = headers.map(escapeCsvCell).join(",");
  const bodyLines = rows.map((row) => headers.map((h) => escapeCsvCell(row[h])).join(","));
  // BOM 付与（Excel で UTF-8 を正しく開けるように）
  return "﻿" + [headerLine, ...bodyLines].join("\r\n");
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
