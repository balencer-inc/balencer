"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X, CheckSquare, Check, XCircle, Loader2 } from "lucide-react";
import {
  bulkDeleteProspects,
  bulkApproveProspects,
  bulkRejectProspects,
} from "@/app/campaigns/[id]/actions";
import { cn } from "@/lib/utils";

interface Ctx {
  selected: Set<string>;
  toggle: (id: string) => void;
  toggleAll: (ids: string[]) => void;
  clear: () => void;
}

const ProspectSelectionContext = createContext<Ctx | null>(null);
export const useProspectSelection = () => useContext(ProspectSelectionContext);

export function ProspectSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = (ids: string[]) => {
    setSelected((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      } else {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      }
    });
  };
  const clear = () => setSelected(new Set());

  return (
    <ProspectSelectionContext.Provider value={{ selected, toggle, toggleAll, clear }}>
      {children}
    </ProspectSelectionContext.Provider>
  );
}

export function ProspectBulkActionBar({
  allIds,
  campaignId,
}: {
  allIds: string[];
  campaignId?: string;
}) {
  const ctx = useProspectSelection();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!ctx) return null;
  const count = ctx.selected.size;
  if (count === 0) return null;

  const handleBulkApprove = () => {
    if (!campaignId) return;
    if (!confirm(`選択した ${count}件を一括採用し、HP分析+フック抽出（enrich）を並列実行します。\n${count}社で 60-90秒 ほどかかります。よろしいですか？`)) return;
    setMessage(`採用+分析中... ${count}社並列実行（60-90秒）`);
    startTransition(async () => {
      const res = await bulkApproveProspects(Array.from(ctx.selected), campaignId);
      if (res.ok) {
        setMessage(`✓ ${res.approved}件採用 / enrich成功 ${res.enriched} / 失敗 ${res.failed}`);
        ctx.clear();
        router.refresh();
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage(`エラー: ${res.error}`);
      }
    });
  };

  const handleBulkReject = () => {
    if (!campaignId) return;
    if (!confirm(`選択した ${count}件を一括却下します。よろしいですか？`)) return;
    setMessage("却下中...");
    startTransition(async () => {
      const res = await bulkRejectProspects(Array.from(ctx.selected), campaignId);
      if (res.ok) {
        setMessage(`✓ ${res.count}件を却下しました`);
        ctx.clear();
        router.refresh();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage(`エラー: ${res.error}`);
      }
    });
  };

  const handleBulkDelete = () => {
    if (!confirm(`選択した ${count}件の候補を完全に削除します。よろしいですか？\n（関連する下書きも削除されます）`)) return;
    setMessage("削除中...");
    startTransition(async () => {
      const res = await bulkDeleteProspects(Array.from(ctx.selected));
      if (res.ok) {
        setMessage(`✓ ${res.count}件を削除しました`);
        ctx.clear();
        router.refresh();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage(`エラー: ${res.error}`);
      }
    });
  };

  const handleToggleAll = () => ctx.toggleAll(allIds);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-white rounded-2xl shadow-xl px-5 py-3 flex items-center gap-3 flex-wrap max-w-[95vw]">
      <div className="flex items-center gap-2">
        <CheckSquare className="w-4 h-4 text-accent" />
        <span className="font-en font-medium text-[13px]">{count}件選択中</span>
        <button onClick={ctx.clear} className="text-white/60 hover:text-white" disabled={pending}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="h-6 w-px bg-white/20" />
      <button
        onClick={handleToggleAll}
        disabled={pending}
        className="text-[11.5px] font-en font-medium text-white/80 hover:text-white disabled:opacity-50"
      >
        全選択/解除
      </button>
      {campaignId && (
        <>
          <button
            onClick={handleBulkApprove}
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-en font-medium bg-emerald-600 hover:bg-emerald-700 rounded-md disabled:opacity-50"
            title="採用してHP分析+フック抽出まで実行"
          >
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            一括採用 ({count})
          </button>
          <button
            onClick={handleBulkReject}
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-en font-medium bg-amber-600 hover:bg-amber-700 rounded-md disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            一括却下 ({count})
          </button>
        </>
      )}
      <button
        onClick={handleBulkDelete}
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-en font-medium bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
      >
        <Trash2 className="w-3.5 h-3.5" />
        一括削除 ({count})
      </button>
      {message && (
        <div className="absolute -top-12 left-0 right-0 mx-auto bg-white text-ink rounded-md px-3 py-1.5 text-[11.5px] shadow-md border border-border max-w-md text-center font-medium">
          {message}
        </div>
      )}
    </div>
  );
}
