"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function reviewProspect(
  prospectId: string,
  campaignId: string,
  decision: "approve" | "reject",
  note?: string
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("prospects")
    .update({
      status: decision === "approve" ? "approved" : "rejected",
      rejection_reason: decision === "reject" ? note || null : null,
    })
    .eq("id", prospectId);
  if (error) return { ok: false, error: error.message };

  // 採用時のみ詳細分析を遅延実行（HP取得+AI判定+フック抽出）
  if (decision === "approve") {
    try {
      const { enrichProspect } = await import("@/lib/research/enrich");
      const r = await enrichProspect(prospectId);
      if (!r.ok) {
        console.warn(`[review.approve.enrich] prospect=${prospectId} failed: ${r.error}`);
      }
    } catch (e) {
      console.error("[review.approve.enrich]", e);
    }
  }

  revalidatePath(`/campaigns/${campaignId}`);
  return { ok: true };
}

/**
 * UI から手動で enrich を再試行するためのアクション
 */
export async function enrichProspectAction(prospectId: string, campaignId: string) {
  const { enrichProspect } = await import("@/lib/research/enrich");
  const result = await enrichProspect(prospectId);
  revalidatePath(`/campaigns/${campaignId}`);
  return result;
}

export async function updateProspectContact(
  prospectId: string,
  campaignId: string,
  data: {
    company_name?: string;
    url?: string;
    contact_method?: "email" | "form" | "unknown";
    contact_value?: string;
  }
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("prospects")
    .update(data)
    .eq("id", prospectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/campaigns/${campaignId}`);
  return { ok: true };
}

export async function resetProspectStatus(prospectId: string, campaignId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("prospects")
    .update({ status: "pending", rejection_reason: null })
    .eq("id", prospectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/campaigns/${campaignId}`);
  return { ok: true };
}

export async function deleteProspect(prospectId: string, campaignId: string) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("email_drafts").delete().eq("prospect_id", prospectId);
  const { error } = await supabase.from("prospects").delete().eq("id", prospectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/campaigns/${campaignId}`);
  return { ok: true };
}

export async function bulkDeleteProspects(prospectIds: string[]) {
  const supabase = createSupabaseAdminClient();
  if (prospectIds.length === 0) return { ok: true as const, count: 0 };
  await supabase.from("email_drafts").delete().in("prospect_id", prospectIds);
  const { error } = await supabase.from("prospects").delete().in("id", prospectIds);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/campaigns");
  return { ok: true as const, count: prospectIds.length };
}

/**
 * 選択した候補を一括採用 + enrich を並列実行
 * 13社全部やっても並列ならローカル環境で60-90秒で完了する想定
 */
export async function bulkApproveProspects(prospectIds: string[], campaignId: string) {
  const supabase = createSupabaseAdminClient();
  if (prospectIds.length === 0) return { ok: true as const, approved: 0, enriched: 0, failed: 0 };

  // status を一括で approved に
  const { error: updErr } = await supabase
    .from("prospects")
    .update({ status: "approved", rejection_reason: null })
    .in("id", prospectIds);
  if (updErr) return { ok: false as const, error: updErr.message };

  // enrich を並列実行（fire-and-await すべて完了まで）
  const { enrichProspect } = await import("@/lib/research/enrich");
  const results = await Promise.allSettled(
    prospectIds.map((id) => enrichProspect(id))
  );
  let enriched = 0;
  let failed = 0;
  for (const r of results) {
    if (r.status === "fulfilled" && (r.value as any)?.ok) enriched++;
    else failed++;
  }

  revalidatePath(`/campaigns/${campaignId}`);
  return {
    ok: true as const,
    approved: prospectIds.length,
    enriched,
    failed,
  };
}

/**
 * 選択した候補を一括却下
 */
export async function bulkRejectProspects(prospectIds: string[], campaignId: string) {
  const supabase = createSupabaseAdminClient();
  if (prospectIds.length === 0) return { ok: true as const, count: 0 };
  const { error } = await supabase
    .from("prospects")
    .update({ status: "rejected" })
    .in("id", prospectIds);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/campaigns/${campaignId}`);
  return { ok: true as const, count: prospectIds.length };
}

/**
 * キャンペーンの全候補（pending/reviewed/approved/rejected すべて）と関連下書きを削除
 * 「やり直し」用。キャンペーン自体は残し、ステータスを draft に戻す
 */
export async function resetCampaignProspects(campaignId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: prospects } = await supabase
    .from("prospects")
    .select("id")
    .eq("campaign_id", campaignId);
  const ids = (prospects || []).map((p: any) => p.id);
  if (ids.length > 0) {
    await supabase.from("email_drafts").delete().in("prospect_id", ids);
    await supabase.from("prospects").delete().in("id", ids);
  }
  await supabase.from("campaigns").update({ status: "draft" }).eq("id", campaignId);
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
  return { ok: true as const, deletedCount: ids.length };
}
