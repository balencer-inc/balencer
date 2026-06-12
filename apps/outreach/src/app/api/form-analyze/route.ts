import { NextRequest, NextResponse } from "next/server";

/**
 * 対象URLのHPからフォーム構造を解析して返す。
 * - まず通常のfetchで試す（軽くて速い）
 * - 失敗したらFirecrawl経由（rawHtml）でWAF/UA制限回避
 * - <form>タグを検出（最も大きいフォーム=本文の問い合わせフォームと推定）
 */
export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) {
    return NextResponse.json({ ok: false, error: "url is required" }, { status: 400 });
  }

  // Step 1: 直接 fetch（ブラウザUAで偽装）
  let html: string | null = null;
  let fetchError: string | null = null;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    });
    if (res.ok) {
      html = await res.text();
    } else {
      fetchError = `HTTP ${res.status}`;
    }
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "fetch failed";
  }

  // Step 2: 直接 fetch が失敗 or form 見つからない場合、Firecrawl で raw HTML を取得
  if (!html || !html.includes("<form")) {
    try {
      const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          formats: ["rawHtml"],
          onlyMainContent: false,
          waitFor: 1500,
        }),
      });
      const fcJson = await fcRes.json();
      if (fcJson.success && fcJson.data?.rawHtml) {
        html = fcJson.data.rawHtml as string;
      } else if (!html) {
        return NextResponse.json({
          ok: false,
          error: `ページ取得に失敗（${fetchError}、Firecrawlでも失敗: ${fcJson.error || "unknown"}）`,
        });
      }
    } catch (e) {
      if (!html) {
        return NextResponse.json({
          ok: false,
          error: `ページ取得に失敗（${fetchError}、Firecrawl例外: ${e instanceof Error ? e.message : "unknown"}）`,
        });
      }
    }
  }

  // 最大の form を選択
  const forms = extractForms(html!);
  if (forms.length === 0) {
    // どんなHTMLが返ってきたか先頭500文字をデバッグに含める
    const sample = html!.slice(0, 500).replace(/\s+/g, " ");
    return NextResponse.json({
      ok: false,
      error: `<form>タグが検出できませんでした。このページはJavaScriptで動的にフォームを生成しているか、別ページ(/contact等)にフォームがある可能性があります。`,
      debug: { htmlLength: html!.length, htmlSample: sample },
    });
  }
  // 入力フィールド数で並べ替えて一番大きいフォーム=お問い合わせフォームと推定
  forms.sort((a, b) => b.fields.length - a.fields.length);
  const main = forms[0];

  // action URL を絶対URLに正規化
  const baseUrl = new URL(url);
  let actionUrl = main.action || url;
  try {
    actionUrl = new URL(actionUrl, baseUrl).toString();
  } catch {
    actionUrl = url;
  }

  return NextResponse.json({
    ok: true,
    action: actionUrl,
    method: (main.method || "POST").toUpperCase(),
    enctype: main.enctype || "application/x-www-form-urlencoded",
    fields: main.fields,
    sourceUrl: url,
  });
}

interface FormField {
  name: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  value?: string;
  options?: { value: string; label: string }[];
}

interface ParsedForm {
  action: string;
  method: string;
  enctype: string;
  fields: FormField[];
}

function extractForms(html: string): ParsedForm[] {
  const formRegex = /<form\b([^>]*)>([\s\S]*?)<\/form>/gi;
  const results: ParsedForm[] = [];
  let m: RegExpExecArray | null;

  while ((m = formRegex.exec(html)) !== null) {
    const attrs = parseAttrs(m[1]);
    const inner = m[2];
    const fields = extractFieldsFromForm(inner);

    // hidden/submit/button のみのフォームはスキップ
    const meaningfulFields = fields.filter(
      (f) => !["hidden", "submit", "button", "image", "reset"].includes(f.type.toLowerCase())
    );
    if (meaningfulFields.length === 0) continue;

    results.push({
      action: attrs.action || "",
      method: attrs.method || "POST",
      enctype: attrs.enctype || "application/x-www-form-urlencoded",
      fields,
    });
  }

  return results;
}

function extractFieldsFromForm(formInner: string): FormField[] {
  const fields: FormField[] = [];
  const labelMap = buildLabelMap(formInner);

  // input
  const inputRegex = /<input\b([^>]*)\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = inputRegex.exec(formInner)) !== null) {
    const a = parseAttrs(m[1]);
    if (!a.name) continue;
    const type = (a.type || "text").toLowerCase();
    fields.push({
      name: a.name,
      type,
      label: findLabelFor(labelMap, a, formInner, m.index) || a.name,
      required: "required" in a || a["aria-required"] === "true",
      placeholder: a.placeholder,
      value: a.value,
    });
  }

  // textarea
  const textareaRegex = /<textarea\b([^>]*)>([\s\S]*?)<\/textarea>/gi;
  while ((m = textareaRegex.exec(formInner)) !== null) {
    const a = parseAttrs(m[1]);
    if (!a.name) continue;
    fields.push({
      name: a.name,
      type: "textarea",
      label: findLabelFor(labelMap, a, formInner, m.index) || a.name,
      required: "required" in a || a["aria-required"] === "true",
      placeholder: a.placeholder,
      value: m[2].trim(),
    });
  }

  // select
  const selectRegex = /<select\b([^>]*)>([\s\S]*?)<\/select>/gi;
  while ((m = selectRegex.exec(formInner)) !== null) {
    const a = parseAttrs(m[1]);
    if (!a.name) continue;
    const options: { value: string; label: string }[] = [];
    const optRegex = /<option\b([^>]*)>([\s\S]*?)<\/option>/gi;
    let om: RegExpExecArray | null;
    while ((om = optRegex.exec(m[2])) !== null) {
      const oa = parseAttrs(om[1]);
      options.push({ value: oa.value || om[2].trim(), label: om[2].trim() });
    }
    fields.push({
      name: a.name,
      type: "select",
      label: findLabelFor(labelMap, a, formInner, m.index) || a.name,
      required: "required" in a,
      options,
    });
  }

  return fields;
}

function parseAttrs(attrStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  const re = /([a-zA-Z_][\w-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrStr)) !== null) {
    const key = m[1].toLowerCase();
    const val = m[2] ?? m[3] ?? m[4] ?? "";
    result[key] = val;
  }
  return result;
}

function buildLabelMap(html: string): Map<string, string> {
  const map = new Map<string, string>();
  const labelRegex = /<label\b([^>]*)>([\s\S]*?)<\/label>/gi;
  let m: RegExpExecArray | null;
  while ((m = labelRegex.exec(html)) !== null) {
    const a = parseAttrs(m[1]);
    const text = stripTags(m[2]).trim();
    if (a.for) map.set(a.for, text);
  }
  return map;
}

function findLabelFor(
  labelMap: Map<string, string>,
  attrs: Record<string, string>,
  html: string,
  fieldStart: number
): string {
  if (attrs.id && labelMap.has(attrs.id)) return labelMap.get(attrs.id)!;
  if (attrs["aria-label"]) return attrs["aria-label"];
  if (attrs.title) return attrs.title;

  // フィールド直前の TH/DT/LABEL/STRONG/SPAN/P テキストを推測
  const before = html.slice(Math.max(0, fieldStart - 500), fieldStart);
  const beforeText = stripTags(before).replace(/\s+/g, " ").trim();
  const lastSegment = beforeText.split(/[\n\r]/).pop() || "";
  if (lastSegment.length > 0 && lastSegment.length < 60) return lastSegment;

  return attrs.placeholder || attrs.name || "";
}

function stripTags(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
