"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { parseCsvText } from "@/lib/research/sources/csv";
import { normalizeHost, isBlockedUrl } from "@/lib/research/urlValidator";

export interface CreateCampaignInput {
  name: string;
  service_id: string;
  sender_persona_id: string;
  csv_filename: string;
  csv_content: string;
}

/**
 * キャンペーン作成 + CSV を即 prospects 化
 * Phase 3: リサーチ機能廃止、CSV-only に集約。
 * organization_id は service から逆引き（service と sender は同一組織前提）
 */
export async function createCampaign(input: CreateCampaignInput) {
  const supabase = createSupabaseAdminClient();

  // service から organization_id を取得（service と sender は同一組織が前提）
  const { data: service, error: svcErr } = await supabase
    .from("services")
    .select("organization_id")
    .eq("id", input.service_id)
    .single();
  if (svcErr || !service) {
    return { ok: false as const, error: "選択されたサービスが見つかりません" };
  }
  const orgId = service.organization_id as string;

  // CSV パース
  const parsed = parseCsvText(input.csv_content, input.csv_filename || "uploaded.csv");
  if (parsed.seeds.length === 0) {
    return {
      ok: false as const,
      error: `CSV から有効な行を読み込めませんでした（必須列: company_name, url）。${parsed.skippedRows.length}行をスキップ`,
    };
  }

  // 重複ホスト除外（同じドメインが複数行に出る場合は最初の1社）
  const seenHosts = new Set<string>();
  const dedupedSeeds = parsed.seeds.filter((s) => {
    if (isBlockedUrl(s.url)) return false;
    const host = normalizeHost(s.url);
    if (!host || seenHosts.has(host)) return false;
    seenHosts.add(host);
    return true;
  });

  // 過去に sent 以上のアクションをしたドメインを取得（送信済みドメイン重複防止）
  // pipeline_stage が "not_sent" 以外 = 既に何らかのアクション済み
  // organization 内のドメインだけを対象とする（バレンサーとTSUGIで別カウント）
  const { data: pastSentData } = await supabase
    .from("prospects")
    .select("url, company_name, pipeline_stage")
    .eq("organization_id", orgId)
    .neq("pipeline_stage", "not_sent");

  const pastSentHosts = new Map<string, string>(); // host -> company_name
  for (const row of pastSentData || []) {
    const host = normalizeHost(row.url);
    if (host && !pastSentHosts.has(host)) pastSentHosts.set(host, row.company_name);
  }

  // 過去送信済みドメインと重複したシードを除外
  const freshSeeds: typeof dedupedSeeds = [];
  const skippedPastSent: Array<{ company_name: string; url: string; matched_with: string }> = [];
  for (const s of dedupedSeeds) {
    const host = normalizeHost(s.url);
    if (host && pastSentHosts.has(host)) {
      skippedPastSent.push({
        company_name: s.company_name,
        url: s.url,
        matched_with: pastSentHosts.get(host)!,
      });
    } else {
      freshSeeds.push(s);
    }
  }

  if (freshSeeds.length === 0) {
    return {
      ok: false as const,
      error: `有効な行がありませんでした（重複: 内 ${dedupedSeeds.length - freshSeeds.length} 社が過去送信済みドメイン）`,
    };
  }

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      organization_id: orgId,
      service_id: input.service_id,
      sender_persona_id: input.sender_persona_id,
      name: input.name,
      industry: null,
      area: null,
      employee_range: null,
      target_count: freshSeeds.length,
      target_strategy: "from_csv",
      additional_instructions: null,
      data_sources: [{ type: "csv", filename: input.csv_filename }],
      status: "reviewing",
    })
    .select("id")
    .single();

  if (error) return { ok: false as const, error: error.message };

  // prospects に CSV 内容を一括 INSERT
  // v2: スキル側でリッチ化済みの contact_method/contact_email/contact_form_url を活かす
  const rows = freshSeeds.map((seed) => {
    const meta = seed.source_meta || {};
    const csvContactMethod = meta.contact_method as "email" | "form" | "both" | "none" | undefined;
    const csvEmail = (meta.contact_email as string) || null;
    const csvFormUrl = (meta.contact_form_url as string) || null;

    // CSV から渡されたメソッドを prospects.contact_method/value に反映
    // both は email を優先
    let contactMethod: "email" | "form" | null = null;
    let contactValue: string | null = null;
    if (csvContactMethod === "email" || (csvContactMethod === "both" && csvEmail)) {
      contactMethod = "email";
      contactValue = csvEmail;
    } else if (csvContactMethod === "form" || (csvContactMethod === "both" && csvFormUrl)) {
      contactMethod = "form";
      contactValue = csvFormUrl;
    }

    return {
      organization_id: orgId,
      campaign_id: campaign.id,
      company_name: seed.company_name,
      url: seed.url,
      industry_tag: (meta.industry as string) || null,
      employee_estimate: (meta.employee_hint as string) || null,
      contact_method: contactMethod,
      contact_value: contactValue,
      analysis: {
        source_meta: meta,
        // CSV側で既に contact 取得済みなら enrich 時にスキップ可能なフラグ
        contact_from_csv: contactMethod !== null,
        // CSV由来のフック（enrich の AI page_excerpts より優先したい場合）
        csv_hook: meta.hook_source
          ? { source: meta.hook_source as string, quote: (meta.hook_quote as string) || "" }
          : null,
        enriched: false,
      },
      dx_score: null,
      data_source: "csv",
      status: "pending",
      pipeline_stage: "not_sent",
    };
  });
  const { error: insertErr } = await supabase.from("prospects").insert(rows);
  if (insertErr) {
    // キャンペーンは作られたが prospects 失敗 → エラー
    return { ok: false as const, error: `候補保存に失敗: ${insertErr.message}` };
  }

  revalidatePath("/campaigns");
  return {
    ok: true as const,
    id: campaign.id,
    inserted: freshSeeds.length,
    skipped: parsed.seeds.length - freshSeeds.length + parsed.skippedRows.length,
    skippedPastSent, // 過去送信済みドメインと重複した社の詳細
  };
}

export async function deleteCampaign(id: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/campaigns");
  return { ok: true as const };
}

/**
 * リサーチ中などで止まっているキャンペーンを「下書き」に戻して再実行可能にする
 */
export async function resetCampaignStatus(id: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("campaigns")
    .update({ status: "draft" })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${id}`);
  return { ok: true as const };
}
