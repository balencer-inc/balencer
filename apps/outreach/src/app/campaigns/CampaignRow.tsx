"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Trash2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteCampaign, resetCampaignStatus } from "./actions";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft: { label: "下書き", color: "bg-gray-100 text-gray-700" },
  researching: { label: "リサーチ中", color: "bg-amber-100 text-amber-800" },
  reviewing: { label: "レビュー中", color: "bg-blue-100 text-blue-800" },
  sending: { label: "送信中", color: "bg-emerald-100 text-emerald-800" },
  done: { label: "完了", color: "bg-ink text-accent" },
  archived: { label: "アーカイブ", color: "bg-gray-50 text-gray-500" },
};

export function CampaignRow({ campaign }: { campaign: any }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const status = STATUS_LABEL[campaign.status] || STATUS_LABEL.draft;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`「${campaign.name}」を削除しますか？候補企業・下書きも一緒に消えます。`)) return;
    startTransition(async () => {
      const res = await deleteCampaign(campaign.id);
      if (!res.ok) alert(res.error || "削除に失敗しました");
      else router.refresh();
    });
  };

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("ステータスを「下書き」に戻して、もう一度リサーチを実行できる状態にしますか？")) return;
    startTransition(async () => {
      const res = await resetCampaignStatus(campaign.id);
      if (!res.ok) alert(res.error || "リセットに失敗しました");
      else router.refresh();
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all flex items-start justify-between gap-4">
      <Link
        href={`/campaigns/${campaign.id}`}
        className="flex-1 min-w-0 -m-5 p-5 hover:-translate-y-0.5 transition-transform"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="font-en text-[16px] font-medium">{campaign.name}</h2>
          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-mono", status.color)}>
            {status.label}
          </span>
        </div>
        <div className="mt-2 text-[12.5px] text-ink-2">
          <span className="font-medium">{campaign.services?.name || "（サービス未指定）"}</span>
          <span className="text-muted"> / 差出人: </span>
          <span>{campaign.sender_personas?.display_name || "（未設定）"}</span>
        </div>
        <div className="mt-2 text-[11.5px] text-muted flex flex-wrap gap-2">
          <span>業種: {campaign.industry || "—"}</span>
          <span>/ エリア: {campaign.area || "—"}</span>
          <span>/ 規模: {campaign.employee_range || "—"}</span>
          <span>/ 目標: {campaign.target_count}社</span>
        </div>
      </Link>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <div className="text-[10.5px] text-muted flex items-center gap-1 font-mono whitespace-nowrap">
          <Calendar className="w-3 h-3" />
          {new Date(campaign.created_at).toLocaleDateString("ja-JP")}
        </div>
        <div className="flex items-center gap-1">
          {(campaign.status === "researching" || campaign.status === "draft") && (
            <button
              type="button"
              onClick={handleReset}
              disabled={pending}
              title="ステータスを下書きに戻す"
              className="p-1.5 rounded hover:bg-amber-50 text-amber-700 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            title="このキャンペーンを削除"
            className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
