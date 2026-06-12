/**
 * 採用済み prospect に対して下書きを生成する。
 */

import { getAnthropic, MODELS } from "@/lib/claude";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { buildDraftPrompt, type GeneratedDraft } from "@/lib/prompts/draft-generation";

// 旧仕様: バレンサー1組織固定。現在は prospect.organization_id を使って動的に解決

/**
 * 1社分の下書きを生成して保存
 * @param templateId 指定すると採用テンプレからこれを使う。未指定なら active_template_ids[0]
 */
export async function generateDraftForProspect(prospectId: string, templateId?: string) {
  const supabase = createSupabaseAdminClient();

  // 必要データを取得
  const { data: prospect, error: pErr } = await supabase
    .from("prospects")
    .select(
      "*, campaigns(id, service_id, sender_persona_id, services(*), sender_personas(*))"
    )
    .eq("id", prospectId)
    .single();

  if (pErr || !prospect) {
    return { ok: false, error: "候補企業が見つかりません" } as const;
  }
  if (prospect.status !== "approved") {
    return { ok: false, error: "採用済みでない候補には下書きを作れません" } as const;
  }

  const campaign = prospect.campaigns;
  const service = campaign.services;
  const sender = campaign.sender_personas;

  // 採用テンプレを取得
  const activeTemplateIds: string[] = service.active_template_ids || [];
  if (activeTemplateIds.length === 0) {
    return { ok: false, error: "採用テンプレがありません" } as const;
  }

  // templateId が指定されていればそれを使う。なければ最初の採用テンプレ。
  // 指定されたが活性テンプレに含まれていなければ最初のものにフォールバック
  const effectiveTemplateId =
    templateId && activeTemplateIds.includes(templateId)
      ? templateId
      : activeTemplateIds[0];

  const { data: template } = await supabase
    .from("service_templates")
    .select("*")
    .eq("id", effectiveTemplateId)
    .single();

  if (!template) {
    return { ok: false, error: "テンプレ取得に失敗しました" } as const;
  }

  // 組織情報（prospect.organization_id から動的に取得 — バレンサー/TSUGI 切り替えに対応）
  const orgId = prospect.organization_id as string;
  const { data: organization } = await supabase
    .from("organizations")
    .select("name, display_address")
    .eq("id", orgId)
    .single();

  // プロンプト構築
  const { system, user } = buildDraftPrompt({
    serviceName: service.name,
    authorityBlock: service.authority_block || {},
    ctaLabel: service.cta_label,
    ctaUrl: service.cta_url,
    resourceLinks: service.resource_links || [],
    template,
    sender,
    organization: organization!,
    prospect: {
      company_name: prospect.company_name,
      url: prospect.url || "",
      industry_tag: prospect.industry_tag || "",
      employee_estimate: prospect.employee_estimate || "",
      contact_method: prospect.contact_method || "unknown",
      analysis: prospect.analysis || {},
    },
  });

  // Claude API 呼び出し
  let parsed: GeneratedDraft;
  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: MODELS.heavy,
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: user }],
    });
    const textBlock = response.content.find((b) => b.type === "text") as any;
    if (!textBlock) {
      return { ok: false, error: "AI応答が空でした" } as const;
    }
    const cleaned = textBlock.text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch (e: any) {
    // Anthropic SDK の APIError の場合、詳細メッセージを取り出す
    const apiErrMessage =
      e?.error?.error?.message ||
      e?.error?.message ||
      e?.body?.error?.message ||
      "";
    const message = e instanceof Error ? e.message : String(e);
    const detail = apiErrMessage ? ` / detail: ${apiErrMessage}` : "";
    const modelInfo = ` / model: ${MODELS.heavy}`;
    console.error("[drafts.generate] API error:", {
      message,
      apiErrMessage,
      model: MODELS.heavy,
      prospectId,
    });
    return {
      ok: false as const,
      error: `下書き生成に失敗: ${message}${detail}${modelInfo}`,
    };
  }

  // フック根拠は必須だが、 page_excerpts が空の場合は仮置きで通す（無いより通すべき）
  const hookEvidence =
    parsed.hook_evidence && parsed.hook_evidence.quote_text
      ? parsed.hook_evidence
      : {
          quote_url: prospect.url || "",
          quote_text: "（HPからフック候補が抽出できなかった候補）",
        };

  // form_fields のフォールバック（AIが返さなかった場合の安全網）
  const formFields = parsed.form_fields || {
    company_name: organization!.name,
    sender_name: sender.display_name,
    sender_email: sender.email_from,
    sender_phone: "",
    subject: parsed.subject || "",
    body_plain: stripMarkdownLocal(parsed.body_md || ""),
  };

  // 既存の下書きがあれば「更新」（IDを維持してURLが空振りしないように）
  const { data: existing } = await supabase
    .from("email_drafts")
    .select("id")
    .eq("prospect_id", prospectId)
    .maybeSingle();

  const insertErr = existing
    ? (
        await supabase
          .from("email_drafts")
          .update({
            service_id: service.id,
            sender_persona_id: sender.id,
            selected_template_id: template.id,
            subject: parsed.subject,
            body_md: parsed.body_md,
            hook_evidence: hookEvidence,
            inserted_resource_link_ids: parsed.inserted_resource_link_ids || [],
            link_insertions: [],
            status: "draft",
            generated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
      ).error
    : (
        await supabase.from("email_drafts").insert({
          organization_id: orgId,
          prospect_id: prospectId,
          service_id: service.id,
          sender_persona_id: sender.id,
          selected_template_id: template.id,
          subject: parsed.subject,
          body_md: parsed.body_md,
          hook_evidence: hookEvidence,
          inserted_resource_link_ids: parsed.inserted_resource_link_ids || [],
          link_insertions: [],
          status: "draft",
        })
      ).error;

  if (insertErr) {
    return { ok: false, error: `下書き保存に失敗: ${insertErr.message}` } as const;
  }

  // form_fields は analysis にマージして保存
  await supabase
    .from("prospects")
    .update({
      analysis: {
        ...(prospect.analysis || {}),
        form_fields: formFields,
      },
      status: "drafted",
    })
    .eq("id", prospectId);

  return { ok: true as const };
}

function stripMarkdownLocal(md: string): string {
  return md
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

/**
 * キャンペーン内の採用済み候補すべてに対して下書きを生成
 * @param templateId 指定すると全ての下書きでこのテンプレを使う
 */
export async function generateDraftsForCampaign(campaignId: string, templateId?: string) {
  const supabase = createSupabaseAdminClient();
  const { data: prospects } = await supabase
    .from("prospects")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("status", "approved");

  if (!prospects || prospects.length === 0) {
    return { ok: false as const, error: "採用済みの候補がありません" };
  }

  const results = { success: 0, failed: 0, errors: [] as string[] };
  for (const p of prospects) {
    const res = await generateDraftForProspect(p.id, templateId);
    if (res.ok) results.success++;
    else {
      results.failed++;
      results.errors.push(res.error);
    }
  }
  return { ok: true as const, ...results };
}
