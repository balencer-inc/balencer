import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const ORG_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Resend Webhook 受信
 *  - email.sent / email.delivered / email.opened / email.clicked / email.bounced / email.complained
 * Phase 1 は署名検証を簡易化（Bearer 形式の RESEND_WEBHOOK_SECRET をヘッダで比較）
 */
export async function POST(req: NextRequest) {
  // 軽量署名検証（本番では Svix で正式検証を入れる）
  const headerSecret = req.headers.get("authorization");
  const expected = process.env.RESEND_WEBHOOK_SECRET;
  if (expected && headerSecret !== `Bearer ${expected}`) {
    // 設定されていれば検証、未設定なら通す（開発時）
    // 本番では必ず secret を設定すること
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const type: string = payload.type || "";
  const data: any = payload.data || {};

  // ヘッダから outreach_send_id を取得（送信時に X-Outreach-Send-Id で付与）
  const outreachSendId: string | undefined =
    data.tags?.find((t: any) => t.name === "outreach_send_id")?.value ||
    data.headers?.["X-Outreach-Send-Id"] ||
    data.headers?.["x-outreach-send-id"];

  if (!outreachSendId) {
    return NextResponse.json({ ok: false, error: "missing outreach_send_id" });
  }

  const supabase = createSupabaseAdminClient();
  const { data: sendRow } = await supabase
    .from("sends")
    .select("id")
    .eq("outreach_send_id", outreachSendId)
    .maybeSingle();
  if (!sendRow) {
    return NextResponse.json({ ok: false, error: "send not found" });
  }

  // イベントを events に記録
  const eventType = mapEventType(type);
  if (eventType) {
    await supabase.from("events").insert({
      organization_id: ORG_ID,
      send_id: sendRow.id,
      type: eventType,
      url: data.link?.url || null,
      user_agent: data.user_agent || data["user-agent"] || null,
      raw_payload: payload,
    });

    // pipeline_stage 自動進行
    const { data: send2 } = await supabase
      .from("sends")
      .select("draft_id, email_drafts(prospect_id)")
      .eq("id", sendRow.id)
      .single();
    const prospectId = (send2 as any)?.email_drafts?.prospect_id;
    if (prospectId) {
      await advancePipelineStage(prospectId, eventType);
    }

    // bounce のとき send.status を更新
    if (eventType === "bounced") {
      await supabase.from("sends").update({ status: "bounced" }).eq("id", sendRow.id);
    }
    if (eventType === "complaint") {
      await supabase.from("sends").update({ status: "complaint" }).eq("id", sendRow.id);
    }
  }

  return NextResponse.json({ ok: true });
}

function mapEventType(type: string): string | null {
  if (type.includes("opened")) return "opened";
  if (type.includes("clicked")) return "clicked";
  if (type.includes("bounced")) return "bounced";
  if (type.includes("complained")) return "complaint";
  return null;
}

async function advancePipelineStage(prospectId: string, eventType: string) {
  const supabase = createSupabaseAdminClient();
  // ステージ順位
  const order = ["not_sent", "sent", "opened", "clicked", "replied", "in_talks", "won", "lost"];
  const { data: prospect } = await supabase
    .from("prospects")
    .select("pipeline_stage")
    .eq("id", prospectId)
    .single();
  if (!prospect) return;

  const newStage = eventType === "bounced" ? "lost" : eventType;
  const currentIdx = order.indexOf(prospect.pipeline_stage);
  const newIdx = order.indexOf(newStage);
  // 後退させない（既に replied/in_talks 等のときに opened が来ても下げない）
  if (newIdx > currentIdx) {
    await supabase
      .from("prospects")
      .update({
        pipeline_stage: newStage,
        pipeline_updated_at: new Date().toISOString(),
      })
      .eq("id", prospectId);
  }
}
