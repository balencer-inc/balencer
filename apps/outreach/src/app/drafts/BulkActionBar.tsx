"use client";

import { useState, useTransition, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Send, AlertCircle, X } from "lucide-react";
import { bulkApproveDrafts, bulkSendDrafts } from "./actions";
import { cn } from "@/lib/utils";

interface SelectionCtx {
  selected: Set<string>;
  toggle: (id: string) => void;
  clear: () => void;
}

const SelectionContext = createContext<SelectionCtx | null>(null);

export function useSelection() {
  return useContext(SelectionContext);
}

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clear = () => setSelected(new Set());

  return (
    <SelectionContext.Provider value={{ selected, toggle, clear }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function BulkActionBar() {
  const ctx = useSelection();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [spacing, setSpacing] = useState(60);

  if (!ctx || ctx.selected.size === 0) return null;
  const count = ctx.selected.size;

  const handleApproveAll = () => {
    setMessage("承認中...");
    startTransition(async () => {
      const ids = Array.from(ctx.selected);
      const res = await bulkApproveDrafts(ids);
      if (res.ok) {
        setMessage(`✓ ${res.count}件を承認しました`);
        router.refresh();
      } else {
        setMessage(`エラー: ${res.error}`);
      }
    });
  };

  const handleSendAll = () => {
    if (!confirm(`${count}件のメール下書きを ${spacing}秒間隔で順次送信します。よろしいですか？\n（フォーム企業は除外されます）`)) return;
    setMessage("送信中...（最初の1通から順次配信、合計で数分かかります）");
    startTransition(async () => {
      const ids = Array.from(ctx.selected);
      const res = await bulkSendDrafts(ids, spacing);
      if (res.ok) {
        setMessage(
          `✓ 完了: 成功 ${res.success} / 失敗 ${res.failed} / スキップ ${res.skipped}（フォーム企業）${
            res.errors.length > 0 ? `\nエラー例: ${res.errors[0]}` : ""
          }`
        );
        ctx.clear();
        router.refresh();
      } else {
        setMessage(`エラー: 一括送信に失敗`);
      }
    });
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-white rounded-2xl shadow-xl border border-ink px-5 py-3 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-accent" />
        <span className="font-en font-medium text-[13px]">{count}件選択中</span>
        <button
          onClick={ctx.clear}
          className="text-[11px] text-white/60 hover:text-white ml-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="h-6 w-px bg-white/20" />
      <button
        onClick={handleApproveAll}
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-en font-medium bg-white/10 hover:bg-white/20 rounded-md disabled:opacity-50"
      >
        <CheckCircle className="w-3.5 h-3.5" />
        一括承認
      </button>
      <div className="flex items-center gap-1.5 text-[11px]">
        <span className="text-white/70">間隔</span>
        <select
          value={spacing}
          onChange={(e) => setSpacing(Number(e.target.value))}
          disabled={pending}
          className="bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-[11px]"
        >
          <option value={30}>30秒</option>
          <option value={60}>60秒</option>
          <option value={90}>90秒</option>
          <option value={120}>120秒</option>
        </select>
      </div>
      <button
        onClick={handleSendAll}
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-en font-medium bg-accent text-ink hover:bg-accent/90 rounded-md disabled:opacity-50"
      >
        <Send className="w-3.5 h-3.5" />
        {pending ? "送信中..." : `一括送信 (${count})`}
      </button>
      {message && (
        <div
          className={cn(
            "absolute -top-12 left-0 right-0 mx-auto bg-white text-ink rounded-md px-3 py-2 text-[11.5px] shadow-md border border-border max-w-md text-center",
            message.startsWith("エラー") && "text-red-600"
          )}
        >
          {message.startsWith("エラー") && <AlertCircle className="w-3 h-3 inline mr-1" />}
          {message}
        </div>
      )}
    </div>
  );
}
