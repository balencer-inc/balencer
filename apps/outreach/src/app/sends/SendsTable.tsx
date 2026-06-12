"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { Eye, MousePointerClick, AlertTriangle, MessageCircle, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReplyMarker } from "./ReplyMarker";
import { updatePipelineStage, deleteSends } from "./actions";

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  queued: { label: "送信中", color: "bg-amber-50 text-amber-700" },
  sent: { label: "送信済", color: "bg-emerald-50 text-emerald-700" },
  bounced: { label: "不達", color: "bg-red-50 text-red-700" },
  complaint: { label: "苦情", color: "bg-red-100 text-red-700" },
  failed: { label: "失敗", color: "bg-gray-100 text-gray-600" },
};

// 進捗ステージ(旧 /pipeline ページから統合)
const STAGES = [
  { key: "not_sent", label: "未送信", icon: "📭" },
  { key: "sent", label: "送信済", icon: "📤" },
  { key: "opened", label: "開封", icon: "👁️" },
  { key: "clicked", label: "クリック", icon: "🔗" },
  { key: "replied", label: "返信", icon: "✉️" },
  { key: "in_talks", label: "商談中", icon: "💬" },
  { key: "won", label: "受注", icon: "🏆" },
  { key: "lost", label: "失注", icon: "✖️" },
];

type Filter = "all" | "no_reply" | "opened" | "replied" | "bounced";
type SortBy = "sent_at" | "company" | "opened" | "replied";

interface Row {
  id: string;
  outreach_send_id: string;
  sent_at: string;
  status: string;
  error_message?: string;
  subject: string;
  draft_id: string;
  company_name: string;
  contact_value: string;
  sender_name: string;
  replied_at: string | null;
  replied_note: string | null;
  prospect_id: string;
  pipeline_stage: string;
  opened: number;
  clicked: number;
  bounced: number;
}

// 各行のステータスセル(進捗ステージ切り替え)
function StageSelect({ prospectId, initialStage }: { prospectId: string; initialStage: string }) {
  const [stage, setStage] = useState(initialStage || "sent");
  const [pending, startTransition] = useTransition();

  const handleChange = (newStage: string) => {
    setStage(newStage);
    startTransition(async () => {
      await updatePipelineStage(prospectId, newStage);
    });
  };

  return (
    <select
      value={stage}
      onChange={(e) => handleChange(e.target.value)}
      disabled={pending}
      className={cn(
        "text-[11px] px-1.5 py-1 border border-border rounded focus:outline-none focus:border-ink bg-white",
        pending && "opacity-50"
      )}
    >
      {STAGES.map((s) => (
        <option key={s.key} value={s.key}>
          {s.icon} {s.label}
        </option>
      ))}
    </select>
  );
}

export function SendsTable({ rows }: { rows: Row[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("sent_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletePending, startDelete] = useTransition();

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`${ids.length}件の送信履歴を削除します。よろしいですか?`)) return;
    startDelete(async () => {
      const res = await deleteSends(ids);
      if (res.ok) {
        setSelectedIds(new Set());
      } else {
        alert(`削除失敗: ${res.error}`);
      }
    });
  };

  const selectAllFailed = () => {
    const failedIds = rows
      .filter((r) => r.status === "bounced" || r.status === "failed" || r.status === "complaint")
      .map((r) => r.id);
    setSelectedIds(new Set(failedIds));
  };

  const filtered = useMemo(() => {
    let list = rows;
    if (filter === "no_reply") list = list.filter((r) => !r.replied_at && r.status === "sent");
    if (filter === "opened") list = list.filter((r) => r.opened > 0);
    if (filter === "replied") list = list.filter((r) => !!r.replied_at);
    if (filter === "bounced") list = list.filter((r) => r.status === "bounced" || r.bounced > 0);

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "sent_at") cmp = new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime();
      else if (sortBy === "company") cmp = a.company_name.localeCompare(b.company_name);
      else if (sortBy === "opened") cmp = a.opened - b.opened;
      else if (sortBy === "replied") {
        const aT = a.replied_at ? new Date(a.replied_at).getTime() : 0;
        const bT = b.replied_at ? new Date(b.replied_at).getTime() : 0;
        cmp = aT - bT;
      }
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [rows, filter, sortBy, sortAsc]);

  const counts = {
    all: rows.length,
    no_reply: rows.filter((r) => !r.replied_at && r.status === "sent").length,
    opened: rows.filter((r) => r.opened > 0).length,
    replied: rows.filter((r) => !!r.replied_at).length,
    bounced: rows.filter((r) => r.status === "bounced" || r.bounced > 0).length,
  };

  const toggleSort = (col: SortBy) => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else {
      setSortBy(col);
      setSortAsc(col === "company");
    }
  };

  const SortHead = ({ col, label, className }: { col: SortBy; label: string; className?: string }) => (
    <th
      onClick={() => toggleSort(col)}
      className={cn(
        "text-left text-[10px] uppercase tracking-[.14em] font-en font-medium text-muted px-3 py-2 cursor-pointer select-none hover:text-ink",
        className
      )}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        {sortBy === col && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </span>
    </th>
  );

  return (
    <div className="space-y-3">
      {/* フィルタタブ + 削除操作 */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
          {[
            { key: "all", label: "全件" },
            { key: "no_reply", label: "未返信" },
            { key: "opened", label: "開封済み" },
            { key: "replied", label: "返信あり" },
            { key: "bounced", label: "不達/バウンス" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as Filter)}
              className={cn(
                "px-3 py-1.5 rounded-full font-en font-medium transition-colors",
                filter === f.key
                  ? "bg-ink text-accent"
                  : "bg-gray-100 text-ink-2 hover:bg-gray-200"
              )}
            >
              {f.label} <span className="ml-1 opacity-70">{counts[f.key as Filter]}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <button
            onClick={selectAllFailed}
            className="px-3 py-1.5 rounded-full font-en font-medium bg-gray-100 text-ink-2 hover:bg-gray-200"
            title="失敗・不達・苦情ステータスの行を全選択"
          >
            失敗を全選択
          </button>
          <button
            onClick={handleDelete}
            disabled={selectedIds.size === 0 || deletePending}
            className={cn(
              "inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-en font-medium transition-colors",
              selectedIds.size === 0 || deletePending
                ? "bg-gray-50 text-muted cursor-not-allowed"
                : "bg-red-50 text-red-700 hover:bg-red-100"
            )}
          >
            <Trash2 className="w-3 h-3" />
            {deletePending ? "削除中..." : `${selectedIds.size}件 削除`}
          </button>
        </div>
      </div>

      {/* テーブル */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="w-8 px-2 py-2">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(filtered.map((r) => r.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                    className="cursor-pointer"
                    title="表示中の行を全選択"
                  />
                </th>
                <SortHead col="company" label="宛先" />
                <th className="text-left text-[10px] uppercase tracking-[.14em] font-en font-medium text-muted px-3 py-2">
                  件名
                </th>
                <SortHead col="sent_at" label="送信日時" />
                <SortHead col="opened" label="開封" className="text-center" />
                <th className="text-center text-[10px] uppercase tracking-[.14em] font-en font-medium text-muted px-3 py-2">
                  クリック
                </th>
                <SortHead col="replied" label="返信" />
                <th className="text-left text-[10px] uppercase tracking-[.14em] font-en font-medium text-muted px-3 py-2">
                  状態
                </th>
                <th className="text-left text-[10px] uppercase tracking-[.14em] font-en font-medium text-muted px-3 py-2">
                  進捗
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-muted text-[12px] py-10">
                    該当する送信がありません
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const st = STATUS_BADGE[r.status] || STATUS_BADGE.queued;
                const hasReply = !!r.replied_at;
                const isSelected = selectedIds.has(r.id);
                return (
                  <tr
                    key={r.id}
                    className={cn(
                      "border-b border-border last:border-b-0 hover:bg-gray-50/50",
                      isSelected && "bg-red-50/30"
                    )}
                  >
                    <td className="px-2 py-2.5 align-top">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(r.id)}
                        className="cursor-pointer mt-1"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium truncate max-w-[200px]">{r.company_name}</div>
                      <div className="font-mono text-[10.5px] text-muted truncate max-w-[200px]">{r.contact_value}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link href={`/drafts/${r.draft_id}`} className="hover:underline truncate max-w-[260px] block">
                        {r.subject || "（件名なし）"}
                      </Link>
                      <div className="text-[10px] text-muted mt-0.5">{r.sender_name}</div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-muted whitespace-nowrap">
                      {new Date(r.sent_at).toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {r.opened > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-blue-600 font-mono text-[11px]">
                          <Eye className="w-3 h-3" /> {r.opened}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {r.clicked > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-emerald-600 font-mono text-[11px]">
                          <MousePointerClick className="w-3 h-3" /> {r.clicked}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <ReplyMarker
                        prospectId={r.prospect_id}
                        hasReply={hasReply}
                        initialNote={r.replied_note || ""}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-mono", st.color)}>
                          {st.label}
                        </span>
                        {r.bounced > 0 && (
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                        )}
                      </div>
                      {r.error_message && (
                        <div className="text-[10px] text-red-600 mt-1 truncate max-w-[180px]" title={r.error_message}>
                          {r.error_message}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <StageSelect prospectId={r.prospect_id} initialStage={r.pipeline_stage} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-[10.5px] text-muted">
        {filtered.length} / {rows.length} 件表示
      </div>
    </div>
  );
}
