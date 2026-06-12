import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * リサーチ実行の進捗を返す。SWR ポーリング用。
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("research_runs")
    .select(
      "id, campaign_id, stage, seeds_count, scraped_count, judged_count, inserted_count, error_message, started_at, finished_at"
    )
    .eq("id", runId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, run: data });
}
