/**
 * 採用押下時の遅延 enrich（1社単位の詳細分析）
 *
 * Phase 3: judge.ts/seeds.ts を廃止して内蔵化
 *
 * フロー（1社あたり数秒）:
 *  - Jina Reader で HP markdown + html を取得（トップ + recruit）
 *  - ヒューリスティクスで DX シグナル評価
 *  - Claude API で フック候補・連絡先・dx_score を JSON 出力
 *  - prospects テーブルを UPDATE
 */

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getAnthropic, MODELS } from "@/lib/claude";
import { jinaReaderScrape } from "./jinaReader";
import { evaluateHpSignals, type SignalEvaluation } from "./heuristics";

export interface EnrichResult {
  ok: boolean;
  error?: string;
  alreadyEnriched?: boolean;
}

/**
 * Markdown/HTML からメアド候補を抽出（info@/contact@/sales@系を優先）
 */
function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const candidates = Array.from(new Set(text.match(emailRegex) || []));
  const PREFERRED = /^(info|contact|inquiry|sales|support|hello|hi|toi?awase|otoiawase|mail|admin)@/i;
  const EXCLUDED =
    /^(noreply|no-reply|donotreply|webmaster|postmaster)@|@example\.|@test\.|sentry\.io|google\.com$/i;
  return candidates
    .filter((e) => !EXCLUDED.test(e))
    .sort((a, b) => {
      const aP = PREFERRED.test(a) ? 0 : 1;
      const bP = PREFERRED.test(b) ? 0 : 1;
      return aP - bP;
    });
}

interface JudgeOutput {
  industry_tag: string;
  employee_estimate: string;
  contact_method: "email" | "form" | "unknown";
  contact_value: string;
  dx_score: number;
  succession_signal: number;
  is_decision_scale: boolean;
  analysis: {
    strengths: string[];
    recent_news?: string;
    language_style?: string;
    page_excerpts: Array<{ url: string; text: string; why_picked: string }>;
  };
  reject_reason?: string;
}

async function judgeOneCompany(
  companyName: string,
  url: string,
  pages: Array<{ url: string; markdown: string }>,
  signals: SignalEvaluation,
  serviceName: string,
  servicePitchAxis: string | null
): Promise<JudgeOutput | null> {
  const anthropic = getAnthropic();
  const emailHints = Array.from(new Set(pages.flatMap((p) => extractEmails(p.markdown))));
  const pagesContent = pages
    .map((p) => `### ページ: ${p.url}\n${p.markdown.slice(0, 3000)}`)
    .join("\n\n");

  const systemPrompt = `あなたはバレンサー（${serviceName} を提供する大阪の企業）の営業リサーチアナリストです。
1社の企業について、提供されたHP情報を元に営業相性を判定してください。

【サービス】 ${serviceName}
【訴求軸】 ${servicePitchAxis || "（未指定）"}

【判定項目】
1. dx_score (0-10): DX/IT/デジタル化の遅れ度。10=非常に遅れている=売り込みやすい
2. is_decision_scale (true/false): 経営者が裁決できる規模か
3. succession_signal (0-3): 後継者問題シグナル
4. employee_estimate (string): "50-100名" 等
5. industry_tag (string): "製造業（食品）" 等
6. contact_method ('email'|'form'|'unknown') + contact_value:
   - メアド見つかれば email + アドレス
   - フォームURLのみ → form + URL
   - 不明 → unknown
7. analysis.page_excerpts (3個まで): フック候補。HP本文から特徴的な一文を**そのまま引用**し、出典URLと why_picked（営業フックとして使える理由）を添える
8. analysis.strengths (3-5個): 強み・特徴の短い箇条書き
9. reject_reason (任意): 対象外なら理由

【厳守ルール】
- 引用は HP本文に書かれている文字列のみ、捏造禁止
- URL は与えられた範囲内のページURLのみ使用

【出力】有効なJSONのみ、前置き不要:
{
  "industry_tag": "...",
  "employee_estimate": "...",
  "contact_method": "email",
  "contact_value": "info@example.com",
  "dx_score": 7,
  "succession_signal": 1,
  "is_decision_scale": true,
  "analysis": {
    "strengths": [...],
    "page_excerpts": [{"url":"...","text":"...","why_picked":"..."}]
  },
  "reject_reason": null
}`;

  const userPrompt = `## 企業: ${companyName}
- HP URL: ${url}
- 機械シグナル: ${JSON.stringify({ score: signals.dx_signal_score, ...signals.signals })}
- メアド候補（自動抽出）: ${emailHints.length > 0 ? emailHints.join(", ") : "（検出なし）"}

${pagesContent}`;

  try {
    const res = await anthropic.messages.create({
      model: MODELS.default,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    const text = (res.content.find((b) => b.type === "text") as any)?.text || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const cleaned = match[0].replace(/```json\s*/gi, "").replace(/```\s*$/g, "").trim();
    const parsed = JSON.parse(cleaned) as JudgeOutput;
    return parsed;
  } catch (e) {
    console.error("[enrich.judge]", e);
    return null;
  }
}

export async function enrichProspect(prospectId: string): Promise<EnrichResult> {
  const supabase = createSupabaseAdminClient();

  const { data: prospect, error: pErr } = await supabase
    .from("prospects")
    .select("*, campaigns(*, services(name, pitch_axis))")
    .eq("id", prospectId)
    .single();
  if (pErr || !prospect) {
    return { ok: false, error: "prospect が見つかりません" };
  }

  if (prospect.analysis?.enriched === true) {
    return { ok: true, alreadyEnriched: true };
  }

  // HP取得（トップ + recruit）
  const main = await jinaReaderScrape(prospect.url, { includeHtml: true });
  if (!main) {
    return { ok: false, error: `HP取得に失敗（${prospect.url}）` };
  }

  const pages = [{ url: main.url, markdown: main.markdown, rawHtml: main.rawHtml }];
  try {
    const u = new URL(prospect.url);
    const recruitUrl = `${u.protocol}//${u.host}/recruit/`;
    const recruit = await jinaReaderScrape(recruitUrl);
    if (recruit && recruit.markdown.length > 100) {
      pages.push({ url: recruit.url, markdown: recruit.markdown, rawHtml: undefined });
    }
  } catch {
    /* recruit ページなしは無視 */
  }

  // ヒューリスティクス
  const evaluation = evaluateHpSignals({
    url: prospect.url,
    markdown: main.markdown,
    rawHtml: main.rawHtml,
    recruitPageContent: pages[1]?.markdown,
    lastModifiedHeader: main.lastModified,
  });

  // AI 判定（1社）
  const campaign = prospect.campaigns;
  const result = await judgeOneCompany(
    prospect.company_name,
    prospect.url,
    pages.map((p) => ({ url: p.url, markdown: p.markdown })),
    evaluation,
    campaign?.services?.name || "（サービス未指定）",
    campaign?.services?.pitch_axis || null
  );

  if (!result) {
    return { ok: false, error: "AI判定の結果が空でした" };
  }

  // CSV由来の contact があれば AI の推測より優先（スキル側で確証済み）
  const contactFromCsv = prospect.analysis?.contact_from_csv === true;
  const finalContactMethod = contactFromCsv ? prospect.contact_method : result.contact_method;
  const finalContactValue = contactFromCsv ? prospect.contact_value : result.contact_value;

  // CSV由来のフック（hook_source + hook_quote）を page_excerpts の先頭に挿入
  const csvHook = prospect.analysis?.csv_hook as { source: string; quote: string } | null | undefined;
  const aiExcerpts = result.analysis?.page_excerpts || [];
  const finalExcerpts =
    csvHook?.source && csvHook?.quote
      ? [
          { url: csvHook.source, text: csvHook.quote, why_picked: "色のあるソース（リスト作成時に確定）" },
          ...aiExcerpts,
        ]
      : aiExcerpts;

  // UPDATE
  const { error: updErr } = await supabase
    .from("prospects")
    .update({
      industry_tag: result.industry_tag || prospect.industry_tag,
      employee_estimate: result.employee_estimate || prospect.employee_estimate,
      contact_method: finalContactMethod,
      contact_value: finalContactValue,
      dx_score: typeof result.dx_score === "number" ? Math.max(0, Math.min(10, result.dx_score)) : 5,
      analysis: {
        ...prospect.analysis,
        strengths: result.analysis?.strengths || [],
        recent_news: result.analysis?.recent_news,
        language_style: result.analysis?.language_style,
        page_excerpts: finalExcerpts,
        dx_signals: evaluation.signals,
        dx_signal_score: evaluation.dx_signal_score,
        succession_signal: result.succession_signal,
        is_decision_scale: result.is_decision_scale,
        reject_reason: result.reject_reason,
        enriched: true,
        enriched_at: new Date().toISOString(),
      },
    })
    .eq("id", prospectId);

  if (updErr) {
    return { ok: false, error: `prospect 更新失敗: ${updErr.message}` };
  }

  return { ok: true };
}
