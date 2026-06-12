import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rowsToCsv, csvResponse } from "@/lib/csv-export";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const campaignId = url.searchParams.get("campaignId");
  if (!campaignId) return NextResponse.json({ ok: false, error: "campaignId required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: prospects, error } = await supabase
    .from("prospects")
    .select("company_name, url, industry_tag, employee_estimate, contact_method, contact_value, status, pipeline_stage, dx_score, created_at, analysis")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const headers = [
    "company_name",
    "url",
    "industry_tag",
    "employee_estimate",
    "contact_method",
    "contact_value",
    "status",
    "pipeline_stage",
    "dx_score",
    "created_at",
    "strengths",
    "page_excerpts",
  ];
  const rows = (prospects || []).map((p: any) => ({
    ...p,
    strengths: Array.isArray(p.analysis?.strengths) ? p.analysis.strengths.join(" / ") : "",
    page_excerpts: Array.isArray(p.analysis?.page_excerpts)
      ? p.analysis.page_excerpts.map((e: any) => `${e.text} (${e.url})`).join(" | ")
      : "",
  }));

  const csv = rowsToCsv(headers, rows);
  return csvResponse(`prospects-${campaignId.slice(0, 8)}.csv`, csv);
}
