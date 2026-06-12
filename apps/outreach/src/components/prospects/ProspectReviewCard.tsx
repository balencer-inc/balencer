"use client";

import { useState, useTransition, useOptimistic, useRef, useEffect, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Mail,
  FileText,
  Check,
  X,
  Pencil,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  reviewProspect,
  updateProspectContact,
  resetProspectStatus,
  deleteProspect,
} from "@/app/campaigns/[id]/actions";
import { useProspectSelection } from "./ProspectSelectionContext";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending: { label: "未", color: "bg-amber-50 text-amber-700" },
  reviewed: { label: "確認", color: "bg-blue-50 text-blue-700" },
  approved: { label: "採用", color: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "却下", color: "bg-red-50 text-red-700" },
  drafted: { label: "下書", color: "bg-purple-50 text-purple-700" },
  sent: { label: "送信", color: "bg-ink text-accent" },
  bounced: { label: "不達", color: "bg-red-100 text-red-700" },
  unsubscribed: { label: "停止", color: "bg-gray-100 text-gray-600" },
};

interface Props {
  prospect: any;
  campaignId: string;
  showCampaignName?: boolean;
}

export function ProspectReviewCard({ prospect, campaignId, showCampaignName }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [contactMethod, setContactMethod] = useState<string>(prospect.contact_method || "unknown");
  const [contactValue, setContactValue] = useState<string>(prospect.contact_value || "");
  const [companyName, setCompanyName] = useState<string>(prospect.company_name || "");
  const [url, setUrl] = useState<string>(prospect.url || "");

  const [optimisticStatus, setOptimisticStatus] = useOptimistic(prospect.status as string);
  const [feedback, setFeedback] = useState<"approving" | "rejecting" | "resetting" | null>(null);
  // 採用時の enrich バックグラウンド処理状態
  const [enriching, setEnriching] = useState(false);

  const status = STATUS_BADGE[optimisticStatus] || STATUS_BADGE.pending;
  const analysis = prospect.analysis || {};
  const excerpts = analysis.page_excerpts || [];
  const isReviewed = optimisticStatus === "approved" || optimisticStatus === "rejected";
  const isEnriched = analysis.enriched === true;

  const sel = useProspectSelection();
  const isChecked = sel?.selected.has(prospect.id) || false;

  const cardRef = useRef<HTMLDivElement>(null);

  // 次のカードへフォーカス移動するヘルパー
  const focusNextCard = (direction: 1 | -1) => {
    if (!cardRef.current) return;
    const all = Array.from(document.querySelectorAll<HTMLDivElement>("[data-prospect-card]"));
    const idx = all.indexOf(cardRef.current);
    if (idx === -1) return;
    const next = all[idx + direction];
    if (next) {
      next.focus();
      next.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const handleApprove = () => {
    setFeedback("approving");
    setEnriching(true);
    startTransition(async () => {
      setOptimisticStatus("approved");
      // 採用後、サーバ側で enrich が走る（数秒）
      await reviewProspect(prospect.id, campaignId, "approve");
      setFeedback(null);
      // フォーカスは即時次へ、enrich は裏で続行
      setTimeout(() => focusNextCard(1), 150);
      // refresh で enrich 後のデータ取得
      router.refresh();
      // enrich 完了のスピナーを6秒で自動オフ（次回 refresh で消える想定）
      setTimeout(() => setEnriching(false), 6000);
    });
  };
  const handleReject = () => {
    setFeedback("rejecting");
    startTransition(async () => {
      setOptimisticStatus("rejected");
      await reviewProspect(prospect.id, campaignId, "reject");
      setFeedback(null);
      setTimeout(() => focusNextCard(1), 150);
    });
  };
  const handleReset = () => {
    setFeedback("resetting");
    startTransition(async () => {
      setOptimisticStatus("pending");
      await resetProspectStatus(prospect.id, campaignId);
      setFeedback(null);
    });
  };
  const handleSaveContact = () => {
    startTransition(async () => {
      await updateProspectContact(prospect.id, campaignId, {
        company_name: companyName,
        url,
        contact_method: contactMethod as any,
        contact_value: contactValue,
      });
      setEditing(false);
    });
  };
  const handleDelete = () => {
    if (!confirm(`「${prospect.company_name}」を候補から完全に削除します。よろしいですか？`)) return;
    startTransition(async () => {
      await deleteProspect(prospect.id, campaignId);
    });
  };

  // キーボードショートカット
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (editing) return; // 編集中は無効
    // 入力系の child にフォーカスがある時はスキップ
    const target = e.target as HTMLElement;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) return;

    const key = e.key.toLowerCase();
    if (key === "a" && !isReviewed) {
      e.preventDefault();
      handleApprove();
    } else if (key === "r" && !isReviewed) {
      e.preventDefault();
      handleReject();
    } else if (key === "e") {
      e.preventDefault();
      setEditing(!editing);
    } else if (key === "arrowdown") {
      e.preventDefault();
      focusNextCard(1);
    } else if (key === "arrowup") {
      e.preventDefault();
      focusNextCard(-1);
    } else if (key === " " || key === "enter") {
      e.preventDefault();
      setExpanded(!expanded);
    } else if (key === "u" && isReviewed) {
      e.preventDefault();
      handleReset();
    }
  };

  return (
    <div
      ref={cardRef}
      data-prospect-card={prospect.id}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn(
        "bg-card border rounded-md transition-all duration-200 outline-none",
        "focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:border-ink",
        optimisticStatus === "rejected" && "opacity-50",
        optimisticStatus === "approved" && "border-emerald-300 bg-emerald-50/30",
        feedback === "approving" && "ring-2 ring-emerald-400",
        feedback === "rejecting" && "ring-2 ring-red-400"
      )}
    >
      {/* メイン1行（コンパクト） */}
      <div className="flex items-center gap-2 px-3 py-2">
        {sel && (
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => sel.toggle(prospect.id)}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 cursor-pointer"
            title="一括操作用に選択"
          />
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted hover:text-ink shrink-0"
          title="詳細"
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        <span
          className={cn("text-[9.5px] px-1.5 py-0.5 rounded font-mono shrink-0 w-12 text-center", status.color)}
        >
          {status.label}
        </span>

        <ContactIcon method={prospect.contact_method} />

        <div className="font-medium text-[13px] truncate min-w-0 flex-1">
          {prospect.company_name}
        </div>

        {prospect.url && (
          <a
            href={prospect.url}
            target="_blank"
            rel="noopener"
            onClick={(e) => e.stopPropagation()}
            className="hidden sm:flex items-center gap-1 text-[11.5px] text-blue-700 hover:text-blue-900 hover:underline font-mono truncate max-w-[260px]"
            title={prospect.url}
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span className="truncate">{prospect.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
          </a>
        )}

        <span
          className="hidden md:block text-[11px] text-muted truncate max-w-[140px] shrink-0"
          title={prospect.industry_tag || "未分析"}
        >
          {prospect.industry_tag || <span className="text-gray-400">業種?</span>}
        </span>

        <span className="hidden md:block text-[11px] text-muted shrink-0">
          {prospect.employee_estimate || <span className="text-gray-400">規模?</span>}
        </span>

        <span
          className={cn(
            "hidden md:block text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0",
            prospect.contact_method === "email" && "bg-emerald-100 text-emerald-700",
            prospect.contact_method === "form" && "bg-amber-100 text-amber-700",
            (!prospect.contact_method || prospect.contact_method === "unknown") && "bg-gray-100 text-gray-500"
          )}
          title={
            prospect.contact_method === "email"
              ? `メアドあり: ${prospect.contact_value || ""}`
              : prospect.contact_method === "form"
              ? `フォーム: ${prospect.contact_value || ""}`
              : "未分析（採用すると詳細分析が走る）"
          }
        >
          {prospect.contact_method === "email"
            ? "📧 メアド"
            : prospect.contact_method === "form"
            ? "📝 フォーム"
            : "未分析"}
        </span>

        {showCampaignName && prospect.campaigns && (
          <Link
            href={`/campaigns/${prospect.campaigns.id}`}
            onClick={(e) => e.stopPropagation()}
            className="hidden xl:block text-[10px] text-muted underline hover:text-ink truncate max-w-[140px]"
          >
            {prospect.campaigns.name}
          </Link>
        )}

        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {!isReviewed ? (
            <>
              <button
                onClick={handleReject}
                disabled={pending}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 text-[11px] font-en font-medium rounded transition-all",
                  "text-muted hover:bg-red-50 hover:text-red-700",
                  feedback === "rejecting" && "bg-red-100 text-red-700"
                )}
                title="却下 (R)"
              >
                <X className="w-3 h-3" />
                却下
              </button>
              <button
                onClick={handleApprove}
                disabled={pending}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 text-[11px] font-en font-medium rounded transition-all",
                  "bg-ink text-accent hover:bg-gray-900",
                  feedback === "approving" && "bg-emerald-700 scale-95"
                )}
                title="採用 (A)"
              >
                <Check className="w-3 h-3" />
                採用
              </button>
            </>
          ) : (
            <button
              onClick={handleReset}
              disabled={pending}
              className="inline-flex items-center gap-1 px-2 py-1 text-[10.5px] font-en font-medium text-muted hover:text-ink rounded"
              title="レビュー取り消し (U)"
            >
              <RotateCcw className="w-3 h-3" />
              取消
            </button>
          )}
          <button
            onClick={() => setEditing(!editing)}
            className="p-1 text-muted hover:text-ink rounded"
            title="連絡先を編集 (E)"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={handleDelete}
            disabled={pending}
            className="p-1 text-muted hover:text-red-600 rounded"
            title="削除"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 連絡先値（メアド/フォームURL） */}
      {prospect.contact_value && (
        <div className="px-3 pb-1.5 pl-[68px] -mt-1 text-[10.5px] font-mono text-muted truncate">
          {prospect.contact_value}
        </div>
      )}

      {/* AI 選定理由 */}
      {prospect.analysis?.source_meta?.reason && !prospect.contact_value && (
        <div className="px-3 pb-1.5 pl-[68px] -mt-1 text-[10.5px] text-muted truncate" title={prospect.analysis.source_meta.reason}>
          💬 {prospect.analysis.source_meta.reason}
        </div>
      )}

      {/* enrich 中スピナー（採用直後） */}
      {enriching && !isEnriched && optimisticStatus === "approved" && (
        <div className="px-3 pb-2 pl-[68px] -mt-1 text-[11px] text-emerald-700 flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" />
          HP分析+フック抽出中... (数秒)
        </div>
      )}

      {/* 編集フォーム */}
      {editing && (
        <div className="mx-3 mb-2 bg-gray-50 rounded-md p-3 space-y-2">
          <div className="text-[10px] uppercase tracking-[.14em] font-en font-medium text-muted">
            連絡先を編集
          </div>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="社名"
            className="w-full text-[12px] border border-border rounded px-2 py-1"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL"
            className="w-full text-[11.5px] font-mono border border-border rounded px-2 py-1"
          />
          <div className="grid grid-cols-3 gap-2">
            <select
              value={contactMethod}
              onChange={(e) => setContactMethod(e.target.value)}
              className="text-[12px] border border-border rounded px-2 py-1"
            >
              <option value="email">メール</option>
              <option value="form">フォーム</option>
              <option value="unknown">不明</option>
            </select>
            <input
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              placeholder={contactMethod === "form" ? "フォームURL" : "メアド"}
              className="col-span-2 text-[11.5px] font-mono border border-border rounded px-2 py-1"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setEditing(false)}
              className="px-2 py-1 text-[11px] text-muted hover:text-ink"
            >
              キャンセル
            </button>
            <button
              onClick={handleSaveContact}
              disabled={pending}
              className="px-3 py-1 text-[11px] font-en font-medium bg-ink text-accent rounded hover:bg-gray-900"
            >
              保存
            </button>
          </div>
        </div>
      )}

      {/* 詳細展開（フック・強み） */}
      {expanded && (
        <div className="border-t border-border px-3 py-3 bg-gray-50/50 space-y-3">
          {analysis.strengths && analysis.strengths.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-[.14em] font-en font-medium text-muted mb-1">
                strengths
              </div>
              <ul className="text-[11.5px] text-ink-2 space-y-0.5">
                {analysis.strengths.slice(0, 4).map((s: string, i: number) => (
                  <li key={i} className="leading-relaxed">
                    ・{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {excerpts.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-[.14em] font-en font-medium text-muted mb-1">
                フック候補
              </div>
              <div className="space-y-1.5">
                {excerpts.slice(0, 3).map((ex: any, i: number) => (
                  <div key={i} className="bg-yellow-50 border-l-2 border-yellow-400 p-2 rounded-r">
                    <div className="text-[11.5px] text-ink leading-relaxed italic">"{ex.text}"</div>
                    {ex.why_picked && (
                      <div className="mt-0.5 text-[10px] text-muted">{ex.why_picked}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ContactIcon({ method }: { method: string }) {
  if (method === "email") {
    return (
      <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-label="メール" />
    );
  }
  if (method === "form") {
    return (
      <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-label="フォーム" />
    );
  }
  return <Building2 className="w-3.5 h-3.5 text-muted shrink-0" aria-label="不明" />;
}
