import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CampaignDetail } from "./CampaignDetail";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ skipped_past_sent?: string }>;
}

export default async function CampaignDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const skippedPastSent = sp.skipped_past_sent ? parseInt(sp.skipped_past_sent, 10) : 0;
  const supabase = await createSupabaseServerClient();

  // 並列フェッチ（キャンペーンと候補を同時に取得）
  const [campaignResult, prospectsResult] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name, status, created_at, services(name), sender_personas(display_name, email_from)")
      .eq("id", id)
      .single(),
    supabase
      .from("prospects")
      .select("id, company_name, url, industry_tag, employee_estimate, contact_method, contact_value, analysis, status, pipeline_stage, researched_at, data_source")
      .eq("campaign_id", id)
      .order("researched_at", { ascending: false }),
  ]);

  const { data: campaign, error } = campaignResult;
  if (error || !campaign) {
    notFound();
  }

  return (
    <>
      {skippedPastSent > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-md p-3 text-[12.5px] text-amber-900 mb-4">
          重複防止: 過去送信済みドメインと一致した <strong>{skippedPastSent}社</strong> を自動除外しました
        </div>
      )}
      <CampaignDetail campaign={campaign} prospects={prospectsResult.data || []} />
    </>
  );
}
