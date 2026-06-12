"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Building2, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { updatePipelineStage } from "@/app/sends/actions";
import { cn } from "@/lib/utils";

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

const EVENT_ICON: Record<string, string> = {
  sent: "📤",
  opened: "👁️",
  clicked: "🔗",
  replied: "✉️",
  bounced: "🔴",
};

interface Props {
  prospect: any;
  timeline: Array<{ type: string; at: string }>;
}

export function PipelineRow({ prospect, timeline }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [stage, setStage] = useState(prospect.pipeline_stage || "not_sent");
  const [note, setNote] = useState(prospect.pipeline_note || "");
  const [pending, startTransition] = useTransition();

  const stageData = STAGES.find((s) => s.key === stage);

  const handleStageChange = (newStage: string) => {
    setStage(newStage);
    startTransition(async () => {
      await updatePipelineStage(prospect.id, newStage, note);
    });
  };

  const handleNoteSave = () => {
    startTransition(async () => {
      await updatePipelineStage(prospect.id, stage, note);
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
          <Building2 className="w-3.5 h-3.5 text-ink-2" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-[13px] truncate">{prospect.company_name}</span>
            {prospect.contact_method && (
              <span className="text-[9px] font-mono text-muted uppercase">{prospect.contact_method}</span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px]">
            {timeline.length === 0 && <span className="text-muted">タイムラインなし</span>}
            {timeline.slice(0, 8).map((e, i) => (
              <span key={i} className="inline-flex items-center gap-0.5 text-muted">
                {EVENT_ICON[e.type] || "•"}
                <span className="font-mono">
                  {new Date(e.at).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                </span>
                {i < timeline.length - 1 && i < 7 && <span className="opacity-30">→</span>}
              </span>
            ))}
          </div>
        </div>

        <select
          value={stage}
          onChange={(e) => handleStageChange(e.target.value)}
          disabled={pending}
          className="text-[11.5px] px-2 py-1 border border-border rounded-md focus:outline-none focus:border-ink"
        >
          {STAGES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.icon} {s.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 text-muted hover:text-ink"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-3 border-t border-border pt-3 space-y-3">
          <div className="text-[11.5px] text-ink-2 leading-relaxed flex flex-wrap gap-x-3 gap-y-1">
            {prospect.url && (
              <a href={prospect.url} target="_blank" rel="noopener" className="text-muted underline hover:text-ink">
                {prospect.url}
              </a>
            )}
            {prospect.contact_value && (
              <span className="text-muted font-mono">{prospect.contact_value}</span>
            )}
            {prospect.campaigns && (
              <Link
                href={`/campaigns/${prospect.campaigns.id}`}
                className="text-muted underline hover:text-ink"
              >
                {prospect.campaigns.name}
              </Link>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-en font-medium uppercase tracking-[.14em] text-muted mb-1.5">
              メモ
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={handleNoteSave}
              rows={2}
              placeholder="商談メモ・約束事・次のアクション等"
              className="w-full text-[12px] border border-border rounded-md p-2 focus:outline-none focus:border-ink"
            />
            <div className="text-[10px] text-muted/80 mt-1">フォーカス外で自動保存</div>
          </div>

          {timeline.length > 0 && (
            <div>
              <div className="text-[10px] font-en font-medium uppercase tracking-[.14em] text-muted mb-1.5">
                タイムライン詳細
              </div>
              <ul className="space-y-1 text-[11px]">
                {timeline.map((e, i) => (
                  <li key={i} className="flex items-center gap-2 text-ink-2">
                    <span>{EVENT_ICON[e.type] || "•"}</span>
                    <span>{e.type}</span>
                    <span className="text-muted font-mono">
                      {new Date(e.at).toLocaleString("ja-JP")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
