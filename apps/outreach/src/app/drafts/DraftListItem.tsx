"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, FileText, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelection } from "./BulkActionBar";
import { deleteDraft } from "./actions";

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-amber-400",
  approved: "bg-emerald-500",
  rejected: "bg-red-500",
  sent: "bg-ink",
  failed: "bg-red-500",
};

export function DraftListItem({ draft, selected }: { draft: any; selected: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);
  const isForm = draft.prospects?.contact_method === "form";
  const Icon = isForm ? FileText : Mail;
  const iconColor = isForm ? "text-amber-600" : "text-ink-2";
  const dotColor = STATUS_COLOR[draft.status] || STATUS_COLOR.draft;
  const sel = useSelection();
  const isChecked = sel?.selected.has(draft.id) || false;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    sel?.toggle(draft.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`「${draft.prospects?.company_name}」宛の下書きを削除します。候補は採用済みに戻り、後で再生成可能です。よろしいですか？`)) return;
    setDeleted(true);
    startTransition(async () => {
      const res = await deleteDraft(draft.id, draft.prospect_id);
      if (!res.ok) {
        setDeleted(false);
        alert((res as any).error || "削除に失敗しました");
        return;
      }
      // 選択中なら一覧（selected を外す）へ遷移
      if (params.get("selected") === draft.id) {
        router.push("/drafts", { scroll: false });
      } else {
        router.refresh();
      }
    });
  };

  if (deleted) {
    return null; // 削除中は表示しない（楽観的UI）
  }

  return (
    <li data-draft-row={draft.id} data-draft-status={draft.status} className="relative group">
      <Link
        href={`/drafts?selected=${draft.id}`}
        scroll={false}
        className={cn(
          "block px-4 py-3 border-b border-border last:border-b-0 transition-colors",
          selected
            ? "bg-ink/[.04] border-l-2 border-l-ink"
            : "hover:bg-gray-50"
        )}
      >
        <div className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => {}}
            onClick={handleCheckboxClick}
            className="mt-1 shrink-0 cursor-pointer"
            title="一括操作で選択"
          />
          <div className="shrink-0 mt-0.5">
            <Icon className={cn("w-3.5 h-3.5", iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[12.5px] truncate">
                {draft.prospects?.company_name || "（社名なし）"}
              </span>
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
            </div>
            <div className="mt-0.5 text-[11px] text-ink-2 truncate">{draft.subject}</div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted">
              {isForm ? (
                <span className="font-mono text-amber-600 truncate max-w-[180px]">
                  Form: {(draft.prospects?.contact_value || "—").replace(/^https?:\/\//, "")}
                </span>
              ) : (
                <span className="font-mono truncate max-w-[180px]">
                  {draft.prospects?.contact_value || "メアド未設定"}
                </span>
              )}
            </div>
            <div className="mt-1 text-[10px] text-muted/80 truncate">
              {draft.prospects?.campaigns?.name} · {draft.sender_personas?.display_name}
            </div>
          </div>
        </div>
      </Link>
      {/* 削除ボタン: ホバー時のみ表示、送信済みは出さない */}
      {draft.status !== "sent" && (
        <button
          onClick={handleDelete}
          disabled={pending}
          title="この下書きを削除（送らない）"
          className="absolute top-2.5 right-2 p-1.5 rounded text-muted hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </li>
  );
}
