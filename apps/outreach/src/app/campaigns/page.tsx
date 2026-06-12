import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Plus, Megaphone } from "lucide-react";
import { CampaignRow } from "./CampaignRow";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, industry, area, employee_range, target_count, status, created_at, service_id, sender_persona_id, services(name), sender_personas(display_name)")
    .order("created_at", { ascending: false });

  return (
    <div className="px-10 py-10 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <div className="balencer-script text-[24px] text-muted">new</div>
          <h1 className="font-en text-[32px] font-medium tracking-[-.01em]">新規作成</h1>
        </div>
        <Link
          href="/campaigns/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-en font-medium bg-ink text-accent hover:bg-gray-900 rounded-md"
        >
          <Plus className="w-3.5 h-3.5" />
          新規作成
        </Link>
      </div>

      <p className="mt-3 text-[13px] text-ink-2 max-w-[640px] leading-relaxed">
        サービス × ターゲット戦略 × 業種 × エリア × 規模 で候補企業を収集して配信。
        Phase 1 は1あたり10社規模の PoC からスタート。
      </p>

      <div className="mt-8 space-y-3">
        {(campaigns || []).length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
            <Megaphone className="w-8 h-8 mx-auto text-muted mb-3" />
            <div className="text-[14px] text-ink-2 font-medium">まだ作成されていません</div>
            <div className="text-[12.5px] text-muted mt-1">
              「新規作成」ボタンから最初の配信先を作成してください
            </div>
          </div>
        ) : (
          campaigns!.map((c: any) => <CampaignRow key={c.id} campaign={c} />)
        )}
      </div>
    </div>
  );
}
