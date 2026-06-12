import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Active なサービス一覧を返す（SWR キャッシュ向け）
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, slug, name, organization_id, pitch_axis, source_material, active_template_ids, authority_block, cta_label, cta_url, resource_links, target_audience"
    )
    .eq("active", true)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ services: data || [] });
}
