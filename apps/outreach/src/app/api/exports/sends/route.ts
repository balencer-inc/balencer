import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rowsToCsv, csvResponse } from "@/lib/csv-export";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: sends, error } = await supabase
    .from("sends")
    .select(
      "id, to_email, subject, status, sent_at, opened_at, clicked_at, replied_at, replied_note, bounce_reason, x_outreach_send_id, prospects(company_name, url)"
    )
    .order("sent_at", { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const headers = [
    "company_name",
    "url",
    "to_email",
    "subject",
    "status",
    "sent_at",
    "opened_at",
    "clicked_at",
    "replied_at",
    "replied_note",
    "bounce_reason",
    "x_outreach_send_id",
  ];
  const rows = (sends || []).map((s: any) => ({
    company_name: s.prospects?.company_name || "",
    url: s.prospects?.url || "",
    to_email: s.to_email,
    subject: s.subject,
    status: s.status,
    sent_at: s.sent_at,
    opened_at: s.opened_at,
    clicked_at: s.clicked_at,
    replied_at: s.replied_at,
    replied_note: s.replied_note,
    bounce_reason: s.bounce_reason,
    x_outreach_send_id: s.x_outreach_send_id,
  }));
  const csv = rowsToCsv(headers, rows);
  return csvResponse(`sends-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
