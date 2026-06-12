import { getResendForDomain } from "@/lib/resend";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { buildEmail } from "./build";

/**
 * @param scheduledAt ISO8601 (例: "2026-05-20T09:00:00+09:00"). 指定すると Resend が予約配信
 */
export async function sendDraftEmail(draftId: string, scheduledAt?: string) {
  const supabase = createSupabaseAdminClient();

  // 下書きを取得 (organization_idも取得して動的に解決)
  const { data: draft, error: dErr } = await supabase
    .from("email_drafts")
    .select(
      "*, organization_id, prospects(id, company_name, contact_method, contact_value), sender_personas(display_name, email_from), organizations:organization_id(name, display_address)"
    )
    .eq("id", draftId)
    .single();

  if (dErr || !draft) {
    return { ok: false as const, error: "下書きが見つかりません" };
  }

  const recipientEmail = draft.prospects?.contact_value;
  if (
    !recipientEmail ||
    draft.prospects?.contact_method !== "email" ||
    !recipientEmail.includes("@")
  ) {
    return { ok: false as const, error: "メールアドレス形式の連絡先が登録されていません" };
  }

  // 配信停止チェック (組織ごと)
  const orgId = draft.organization_id;
  const { data: unsub } = await supabase
    .from("unsubscribes")
    .select("id")
    .eq("organization_id", orgId)
    .eq("email", recipientEmail)
    .maybeSingle();
  if (unsub) {
    return { ok: false as const, error: "このメアドは配信停止リストに登録されています" };
  }

  // sends レコードを先に作って outreach_send_id を確定
  const { data: sendRow, error: insertErr } = await supabase
    .from("sends")
    .insert({
      organization_id: orgId,
      draft_id: draftId,
      status: "queued",
    })
    .select("id, outreach_send_id")
    .single();

  if (insertErr || !sendRow) {
    return { ok: false as const, error: `送信ログ作成失敗: ${insertErr?.message}` };
  }

  // メール本文ビルド
  const built = buildEmail({
    bodyMd: draft.body_md,
    organizationName: draft.organizations?.name || "株式会社バレンサー",
    organizationAddress: draft.organizations?.display_address || null,
    senderEmail: draft.sender_personas?.email_from || "info@balencer.jp",
    outreachSendId: sendRow.outreach_send_id,
    recipientEmail,
  });

  // Resend送信 (差出人ドメインに応じてAPIキー切替)
  try {
    const senderEmail = draft.sender_personas?.email_from || "info@balencer.jp";
    const resend = getResendForDomain(senderEmail);
    const sendPayload: any = {
      from: `${draft.sender_personas?.display_name} <${draft.sender_personas?.email_from}>`,
      to: [recipientEmail],
      replyTo: draft.sender_personas?.email_from,
      subject: draft.subject,
      html: built.html,
      text: built.text,
      headers: {
        "X-Outreach-Send-Id": sendRow.outreach_send_id,
        "List-Unsubscribe": built.listUnsubscribeHeader,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      tags: [{ name: "outreach_send_id", value: sendRow.outreach_send_id }],
    };
    if (scheduledAt) {
      sendPayload.scheduledAt = scheduledAt;
    }
    const { data: resendData, error: resendErr } = await resend.emails.send(sendPayload);

    if (resendErr) {
      await supabase
        .from("sends")
        .update({ status: "failed", error_message: resendErr.message })
        .eq("id", sendRow.id);
      return { ok: false as const, error: `Resend送信失敗: ${resendErr.message}` };
    }

    // sends を更新
    await supabase
      .from("sends")
      .update({
        status: "sent",
        resend_id: resendData?.id,
        sent_at: new Date().toISOString(),
      })
      .eq("id", sendRow.id);

    // draft.status = "sent"
    await supabase
      .from("email_drafts")
      .update({ status: "sent" })
      .eq("id", draftId);

    // prospect ステータス更新
    await supabase
      .from("prospects")
      .update({
        status: "sent",
        pipeline_stage: "sent",
        pipeline_updated_at: new Date().toISOString(),
      })
      .eq("id", draft.prospect_id);

    return {
      ok: true as const,
      sendId: sendRow.id,
      resendId: resendData?.id,
      outreachSendId: sendRow.outreach_send_id,
    };
  } catch (e) {
    await supabase
      .from("sends")
      .update({
        status: "failed",
        error_message: e instanceof Error ? e.message : String(e),
      })
      .eq("id", sendRow.id);
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
