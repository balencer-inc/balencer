"use server";

import { revalidatePath } from "next/cache";
import { generateDraftForProspect, generateDraftsForCampaign } from "@/lib/drafts/generate";
import { sendDraftEmail } from "@/lib/email/send";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function generateAllDraftsForCampaign(campaignId: string, templateId?: string) {
  const result = await generateDraftsForCampaign(campaignId, templateId);
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/drafts");
  return result;
}

/**
 * 採用済みの prospects のうち、指定したIDだけを並列で下書き生成。
 * クライアント側から「5社ずつ」のバッチで複数回呼ばれる前提で、Vercel Hobby 60秒に収まる。
 */
export async function generateDraftsBatchForCampaign(
  campaignId: string,
  prospectIds: string[],
  templateId?: string
) {
  if (prospectIds.length === 0) return { ok: true, success: 0, failed: 0, errors: [] as string[] };

  const results = await Promise.allSettled(
    prospectIds.map((pid) => generateDraftForProspect(pid, templateId))
  );

  const errors: string[] = [];
  let success = 0;
  let failed = 0;
  for (const r of results) {
    if (r.status === "fulfilled" && r.value?.ok) success++;
    else {
      failed++;
      if (r.status === "rejected") errors.push(String(r.reason));
      else if (r.status === "fulfilled" && !r.value?.ok) errors.push(r.value?.error || "unknown");
    }
  }
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/drafts");
  return { ok: failed === 0, success, failed, errors };
}

/**
 * キャンペーンの採用済みかつ未下書きの prospect ID 一覧を取得（クライアントが事前取得用）
 */
export async function listApprovedProspectsForCampaign(campaignId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("id, company_name")
    .eq("campaign_id", campaignId)
    .eq("status", "approved");
  if (error) return { ok: false as const, error: error.message, prospects: [] };
  return { ok: true as const, prospects: data || [] };
}

export async function regenerateDraft(prospectId: string, templateId?: string) {
  const result = await generateDraftForProspect(prospectId, templateId);
  revalidatePath("/drafts");
  return result;
}

export async function updateDraft(
  draftId: string,
  data: { subject?: string; body_md?: string }
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("email_drafts").update(data).eq("id", draftId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/drafts");
  return { ok: true };
}

export async function approveDraft(draftId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("email_drafts")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", draftId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/drafts");
  return { ok: true };
}

export async function sendDraft(draftId: string, scheduledAt?: string) {
  const result = await sendDraftEmail(draftId, scheduledAt);
  revalidatePath("/drafts");
  revalidatePath("/sends");
  revalidatePath("/pipeline");
  return result;
}

export async function bulkSendDrafts(draftIds: string[], spacingSeconds = 60) {
  const supabase = createSupabaseAdminClient();
  // メール送信対象のみ抽出
  const { data: drafts } = await supabase
    .from("email_drafts")
    .select("id, prospects(contact_method)")
    .in("id", draftIds);
  const emailDrafts = (drafts || []).filter(
    (d: any) => d.prospects?.contact_method === "email"
  );

  const results = { success: 0, failed: 0, skipped: 0, errors: [] as string[] };
  for (let i = 0; i < emailDrafts.length; i++) {
    const d = emailDrafts[i];
    const res = await sendDraftEmail(d.id);
    if (res.ok) results.success++;
    else {
      results.failed++;
      results.errors.push(`${d.id.slice(0, 8)}: ${res.error}`);
    }
    // 最後の1通以外は spacingSeconds 待つ（スパム判定回避）
    if (i < emailDrafts.length - 1 && spacingSeconds > 0) {
      await new Promise((r) => setTimeout(r, spacingSeconds * 1000));
    }
  }
  results.skipped = draftIds.length - emailDrafts.length;
  revalidatePath("/drafts");
  revalidatePath("/sends");
  revalidatePath("/pipeline");
  return { ok: true as const, ...results };
}

export async function bulkApproveDrafts(draftIds: string[]) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("email_drafts")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .in("id", draftIds);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/drafts");
  return { ok: true as const, count: draftIds.length };
}

export async function deleteDraft(draftId: string, prospectId: string) {
  const supabase = createSupabaseAdminClient();
  // 下書きを削除
  const { error } = await supabase.from("email_drafts").delete().eq("id", draftId);
  if (error) return { ok: false, error: error.message };
  // prospect ステータスを "approved" に戻す（再度下書き生成可能に）
  await supabase
    .from("prospects")
    .update({ status: "approved" })
    .eq("id", prospectId);

  revalidatePath("/drafts");
  revalidatePath("/campaigns");
  return { ok: true };
}

export async function markFormSent(prospectId: string) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  // prospect の organization_id も取得（sendsレコード作成に必要）
  const { data: prospect, error: pSelErr } = await supabase
    .from("prospects")
    .select("organization_id")
    .eq("id", prospectId)
    .single();
  if (pSelErr || !prospect) return { ok: false, error: "prospect が見つかりません" };

  // prospect 側の status/pipeline 両方を更新
  const { error: pErr } = await supabase
    .from("prospects")
    .update({
      status: "sent",
      pipeline_stage: "sent",
      pipeline_updated_at: now,
    })
    .eq("id", prospectId);
  if (pErr) return { ok: false, error: pErr.message };

  // 紐づく draft の status も "sent" に揃える（フォーム送信モードでは UI 判定に使う）
  const { data: draft } = await supabase
    .from("email_drafts")
    .update({ status: "sent" })
    .eq("prospect_id", prospectId)
    .select("id")
    .maybeSingle();

  // 送信ログ（sends）にも擬似レコードを追加（フォーム送信は Resend を介さないので resend_id は null）
  // 既に同じ draft に sends レコードがあるかチェック（重複防止）
  if (draft?.id) {
    const { data: existingSend } = await supabase
      .from("sends")
      .select("id")
      .eq("draft_id", draft.id)
      .maybeSingle();
    if (!existingSend) {
      await supabase.from("sends").insert({
        organization_id: prospect.organization_id,
        draft_id: draft.id,
        resend_id: null,
        sent_at: now,
        status: "sent",
      });
    }
  }

  revalidatePath("/drafts");
  revalidatePath("/sends");
  revalidatePath("/pipeline");
  return { ok: true };
}

/**
 * フォーム送信のマークを取り消す（誤操作した時の救済）
 */
export async function unmarkFormSent(prospectId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("prospects")
    .update({
      status: "drafted",
      pipeline_stage: "not_sent",
      pipeline_updated_at: new Date().toISOString(),
    })
    .eq("id", prospectId);
  if (error) return { ok: false, error: error.message };
  await supabase
    .from("email_drafts")
    .update({ status: "approved" })
    .eq("prospect_id", prospectId);
  revalidatePath("/drafts");
  revalidatePath("/pipeline");
  return { ok: true };
}
