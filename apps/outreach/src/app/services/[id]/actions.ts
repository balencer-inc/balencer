"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getAnthropic, MODELS } from "@/lib/claude";
import {
  buildTemplateGenerationPrompt,
  type TemplateGenerationOutput,
  type GeneratedProposal,
} from "@/lib/prompts/template-generation";

const ORG_ID = "00000000-0000-0000-0000-000000000001";

// =====================================================================
// 基本情報の保存（CTA / 権威性 / 訴求軸）
// =====================================================================
export async function saveServiceBasicInfo(
  serviceId: string,
  data: {
    name: string;
    pitch_axis: string;
    cta_label: string;
    cta_url: string;
    authority_block: {
      numbers?: string[];
      books?: string[];
      cases?: string[];
    };
  }
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("services")
    .update({
      name: data.name,
      pitch_axis: data.pitch_axis || null,
      cta_label: data.cta_label || null,
      cta_url: data.cta_url || null,
      authority_block: data.authority_block,
    })
    .eq("id", serviceId)
    .eq("organization_id", ORG_ID);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/services/${serviceId}`);
  revalidatePath("/services");
  return { ok: true };
}

// =====================================================================
// 資料テキストの保存
// =====================================================================
export async function saveServiceMaterial(
  serviceId: string,
  material: string,
  targetAudience: {
    industries?: string[];
    company_sizes?: string[];
    job_titles?: string[];
  }
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("services")
    .update({
      source_material: material,
      source_material_updated_at: new Date().toISOString(),
      target_audience: targetAudience,
    })
    .eq("id", serviceId)
    .eq("organization_id", ORG_ID);

  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath(`/services/${serviceId}`);
  revalidatePath("/services");
  return { ok: true };
}

// =====================================================================
// テンプレ 3-4 案を AI で生成して保存
// =====================================================================
export async function generateServiceTemplates(serviceId: string) {
  const supabase = createSupabaseAdminClient();

  // サービス情報を取得
  const { data: service, error: fetchError } = await supabase
    .from("services")
    .select("*")
    .eq("id", serviceId)
    .eq("organization_id", ORG_ID)
    .single();

  if (fetchError || !service) {
    return { ok: false, error: "サービスが見つかりません" };
  }
  if (!service.source_material) {
    return { ok: false, error: "資料テキストが未投入です" };
  }

  // 既に採用中のテンプレを取得（差別化のため AI に渡す）
  const { data: adoptedTemplates } = await supabase
    .from("service_templates")
    .select("label, length_tier, tone, structure")
    .eq("service_id", serviceId)
    .eq("status", "adopted");

  // プロンプト構築
  const { system, user } = buildTemplateGenerationPrompt({
    serviceName: service.name,
    servicePitchAxis: service.pitch_axis,
    sourceMaterial: service.source_material,
    targetAudience: service.target_audience || {},
    authorityBlock: service.authority_block || {},
    ctaLabel: service.cta_label,
    existingAdoptedTemplates: adoptedTemplates || [],
  });

  // Claude API 呼び出し
  const anthropic = getAnthropic();
  let parsed: TemplateGenerationOutput;
  try {
    const response = await anthropic.messages.create({
      model: MODELS.heavy,
      max_tokens: 8000,
      system,
      messages: [{ role: "user", content: user }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { ok: false, error: "AIが空応答を返しました" };
    }
    const raw = textBlock.text.trim();
    // コードフェンス対策
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    return {
      ok: false,
      error: `AI応答のパースに失敗: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  if (!parsed.proposals || parsed.proposals.length === 0) {
    return { ok: false, error: "AIが提案を生成できませんでした" };
  }

  // material のハッシュ（再生成検知用）
  const materialHash = await sha256(service.source_material);

  // 既存の proposed ステータスのテンプレを archived に
  await supabase
    .from("service_templates")
    .update({ status: "archived" })
    .eq("service_id", serviceId)
    .eq("status", "proposed");

  // 新しい提案を保存
  const rows = parsed.proposals.map((p: GeneratedProposal) => ({
    organization_id: ORG_ID,
    service_id: serviceId,
    label: p.label.slice(0, 60),
    length_tier: p.length_tier,
    tone: p.tone,
    structure: p.structure,
    subject_pattern: p.subject_pattern,
    body_pattern: p.body_pattern,
    rationale: p.rationale,
    recommended_resource_link_types: p.recommended_resource_link_types || [],
    generated_from_material_hash: materialHash,
    status: "proposed",
    created_by: "ai",
  }));

  const { error: insertError } = await supabase
    .from("service_templates")
    .insert(rows);

  if (insertError) {
    return { ok: false, error: `保存に失敗: ${insertError.message}` };
  }

  revalidatePath(`/services/${serviceId}`);
  return { ok: true, count: rows.length, reasoning: parsed.selection_reasoning };
}

// =====================================================================
// テンプレを採用
// =====================================================================
export async function adoptTemplate(serviceId: string, templateId: string) {
  const supabase = createSupabaseAdminClient();

  await supabase
    .from("service_templates")
    .update({ status: "adopted" })
    .eq("id", templateId);

  // services.active_template_ids にも追加
  const { data: service } = await supabase
    .from("services")
    .select("active_template_ids")
    .eq("id", serviceId)
    .single();

  const current = (service?.active_template_ids || []) as string[];
  if (!current.includes(templateId)) {
    await supabase
      .from("services")
      .update({ active_template_ids: [...current, templateId] })
      .eq("id", serviceId);
  }

  revalidatePath(`/services/${serviceId}`);
  revalidatePath("/services");
  return { ok: true };
}

// =====================================================================
// テンプレを破棄
// =====================================================================
export async function archiveTemplate(serviceId: string, templateId: string) {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("service_templates")
    .update({ status: "archived" })
    .eq("id", templateId);

  // services.active_template_ids から削除
  const { data: service } = await supabase
    .from("services")
    .select("active_template_ids")
    .eq("id", serviceId)
    .single();

  const current = (service?.active_template_ids || []) as string[];
  await supabase
    .from("services")
    .update({ active_template_ids: current.filter((id) => id !== templateId) })
    .eq("id", serviceId);

  revalidatePath(`/services/${serviceId}`);
  revalidatePath("/services");
  return { ok: true };
}

// =====================================================================
// テンプレの件名・本文を編集
// =====================================================================
export async function updateTemplate(
  serviceId: string,
  templateId: string,
  patch: { subject_pattern?: string; body_pattern?: string }
) {
  const supabase = createSupabaseAdminClient();
  const update: any = {};
  if (patch.subject_pattern !== undefined) update.subject_pattern = patch.subject_pattern;
  if (patch.body_pattern !== undefined) update.body_pattern = patch.body_pattern;
  if (Object.keys(update).length === 0) return { ok: true };

  const { error } = await supabase
    .from("service_templates")
    .update(update)
    .eq("id", templateId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/services/${serviceId}`);
  return { ok: true };
}

// =====================================================================
// resource_links の保存（一括書き換え）
// =====================================================================
export async function saveResourceLinks(
  serviceId: string,
  links: Array<{
    id?: string;
    label: string;
    url: string;
    type: "slide" | "notion" | "pdf" | "web";
    insert_mode: "always" | "optional";
    context_hint?: string;
  }>
) {
  const supabase = createSupabaseAdminClient();
  const normalized = links.map((l) => ({
    id: l.id || crypto.randomUUID(),
    label: l.label,
    url: l.url,
    type: l.type,
    insert_mode: l.insert_mode,
    context_hint: l.context_hint || "",
  }));

  const { error } = await supabase
    .from("services")
    .update({ resource_links: normalized })
    .eq("id", serviceId)
    .eq("organization_id", ORG_ID);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/services/${serviceId}`);
  revalidatePath("/services");
  return { ok: true };
}

// =====================================================================
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
