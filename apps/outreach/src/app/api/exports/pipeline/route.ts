import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rowsToCsv, csvResponse } from "@/lib/csv-export";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: prospects, error } = await supabase
    .from("prospects")
    .select(
      "company_name, url, industry_tag, employee_estimate, contact_method, contact_value, pipeline_stage, pipeline_updated_at, pipeline_note, replied_at, replied_note, campaigns(name)"
    )
    .not("pipeline_stage", "eq", "not_sent")
    .order("pipeline_updated_at", { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const headers = [
    "campaign_name",
    "company_name",
    "url",
    "industry_tag",
    "employee_estimate",
    "contact_method",
    "contact_value",
    "pipeline_stage",
    "pipeline_updated_at",
    "pipeline_note",
    "replied_at",
    "replied_note",
  ];
  const rows = (prospects || []).map((p: any) => ({
    campaign_name: p.campaigns?.name || "",
    company_name: p.company_name,
    url: p.url,
    industry_tag: p.industry_tag,
    employee_estimate: p.employee_estimate,
    contact_method: p.contact_method,
    contact_value: p.contact_value,
    pipeline_stage: p.pipeline_stage,
    pipeline_updated_at: p.pipeline_updated_at,
    pipeline_note: p.pipeline_note,
    replied_at: p.replied_at,
    replied_note: p.replied_note,
  }));
  const csv = rowsToCsv(headers, rows);
  return csvResponse(`pipeline-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
