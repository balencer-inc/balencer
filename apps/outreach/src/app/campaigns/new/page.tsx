import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewCampaignForm } from "./NewCampaignForm";

export const dynamic = "force-dynamic";

export default function NewCampaignPage() {
  return (
    <div className="px-10 py-10 max-w-[860px]">
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-1.5 text-[12px] font-en font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> 一覧へ戻る
      </Link>

      <div className="mt-4">
        <div className="balencer-script text-[22px] text-muted">new</div>
        <h1 className="font-en text-[28px] font-medium tracking-[-.01em]">新規作成</h1>
        <p className="mt-3 text-[13px] text-ink-2 leading-relaxed">
          情報源（AI対話 / gBizINFO / CSV / ランキング）を選んで条件を指定し、候補企業を集めます。
        </p>
      </div>

      <NewCampaignForm />
    </div>
  );
}
