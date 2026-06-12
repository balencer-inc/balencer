import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Send } from "lucide-react";
import { SendsTable } from "./SendsTable";

export const dynamic = "force-dynamic";

export default async function SendsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: sends } = await supabase
    .from("sends")
    .select(
      "id, outreach_send_id, sent_at, status, resend_id, error_message, email_drafts(id, subject, prospect_id, prospects(id, company_name, contact_value, replied_at, replied_note, pipeline_stage), sender_personas(display_name))"
    )
    .order("sent_at", { ascending: false });

  const sendIds = (sends || []).map((s: any) => s.id);
  const { data: events } =
    sendIds.length > 0
      ? await supabase
          .from("events")
          .select("send_id, type, occurred_at")
          .in("send_id", sendIds)
      : { data: [] as any[] };

  const eventCounts: Record<string, { opened: number; clicked: number; bounced: number }> = {};
  for (const e of events || []) {
    if (!eventCounts[e.send_id]) eventCounts[e.send_id] = { opened: 0, clicked: 0, bounced: 0 };
    if (e.type === "opened") eventCounts[e.send_id].opened++;
    if (e.type === "clicked") eventCounts[e.send_id].clicked++;
    if (e.type === "bounced") eventCounts[e.send_id].bounced++;
  }

  // Flatten to rows for client component
  const rows = (sends || []).map((s: any) => {
    const prospect = s.email_drafts?.prospects;
    const ev = eventCounts[s.id] || { opened: 0, clicked: 0, bounced: 0 };
    return {
      id: s.id,
      outreach_send_id: s.outreach_send_id || "",
      sent_at: s.sent_at,
      status: s.status,
      error_message: s.error_message || undefined,
      subject: s.email_drafts?.subject || "",
      draft_id: s.email_drafts?.id || "",
      company_name: prospect?.company_name || "(不明)",
      contact_value: prospect?.contact_value || "",
      sender_name: s.email_drafts?.sender_personas?.display_name || "",
      replied_at: prospect?.replied_at || null,
      replied_note: prospect?.replied_note || null,
      prospect_id: prospect?.id || "",
      pipeline_stage: prospect?.pipeline_stage || "sent",
      opened: ev.opened,
      clicked: ev.clicked,
      bounced: ev.bounced,
    };
  });

  return (
    <div className="px-10 py-10 max-w-[1480px]">
      <div className="flex items-start justify-between">
        <div>
          <div className="balencer-script text-[24px] text-muted">sent</div>
          <h1 className="font-en text-[32px] font-medium tracking-[-.01em]">送信済み</h1>
        </div>
        <a
          href="/api/exports/sends"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-en font-medium bg-gray-100 hover:bg-gray-200 rounded-md"
          title="送信済み一覧を CSV でダウンロード"
        >
          📊 CSV出力
        </a>
      </div>
      <p className="mt-3 text-[13px] text-ink-2 max-w-[640px] leading-relaxed">
        Resend経由で配信したメールの履歴。返信を Gmail で確認したら「返信あり」をマークしてください。
      </p>

      <div className="mt-8">
        {rows.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
            <Send className="w-8 h-8 mx-auto text-muted mb-3" />
            <div className="text-[14px] text-ink-2 font-medium">まだ送信履歴がありません</div>
          </div>
        ) : (
          <SendsTable rows={rows} />
        )}
      </div>
    </div>
  );
}
