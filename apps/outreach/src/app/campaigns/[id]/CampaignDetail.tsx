"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, PenLine, CheckCircle, RotateCcw, FileSpreadsheet, Keyboard } from "lucide-react";
import { resetCampaignProspects } from "./actions";
import {
  generateDraftsBatchForCampaign,
  listApprovedProspectsForCampaign,
} from "@/app/drafts/actions";
import { ProspectReviewCard } from "@/components/prospects/ProspectReviewCard";
import {
  ProspectSelectionProvider,
  ProspectBulkActionBar,
  useProspectSelection,
} from "@/components/prospects/ProspectSelectionContext";
import { cn } from "@/lib/utils";

interface Props {
  campaign: any;
  prospects: any[];
}

export function CampaignDetail(props: Props) {
  return (
    <ProspectSelectionProvider>
      <CampaignDetailInner {...props} />
      <ProspectBulkActionBar
        allIds={props.prospects.map((p) => p.id)}
        campaignId={props.campaign.id}
      />
    </ProspectSelectionProvider>
  );
}

function CampaignDetailInner({ campaign, prospects }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  // 最初の未レビュー候補にフォーカスを自動で当てる（連続レビューを促す）
  useEffect(() => {
    const first = document.querySelector<HTMLDivElement>("[data-prospect-card]");
    if (first && document.activeElement === document.body) {
      first.focus();
    }
  }, []);

  const counts = prospects.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  const total = prospects.length;
  const approved = counts.approved || 0;
  const rejected = counts.rejected || 0;
  const drafted = counts.drafted || 0;
  const remaining = (counts.pending || 0) + (counts.reviewed || 0);
  const readyForDrafts = approved + drafted;

  // 下書き生成の進捗
  const [genProgress, setGenProgress] = useState<{ done: number; total: number; failed: number } | null>(null);

  /**
   * 採用済み prospects を 5社ずつのバッチに分けて並列処理。
   * Vercel Hobby 60秒制限内で 1バッチ=5社並列(30-60秒) を順次実行。
   */
  const handleGenerateDrafts = async () => {
    setMessage(null);
    setIsError(false);

    // 採用済み prospect ID 一覧を取得
    const list = await listApprovedProspectsForCampaign(campaign.id);
    if (!list.ok) {
      setMessage(`エラー: ${list.error}`);
      setIsError(true);
      return;
    }
    const ids = list.prospects.map((p: any) => p.id);
    if (ids.length === 0) {
      setMessage("採用済みの候補がありません");
      setIsError(true);
      return;
    }

    const BATCH_SIZE = 5;
    setGenProgress({ done: 0, total: ids.length, failed: 0 });
    let totalSuccess = 0;
    let totalFailed = 0;
    const allErrors: string[] = [];

    // バッチで順次実行
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      try {
        const res = await generateDraftsBatchForCampaign(campaign.id, batch);
        totalSuccess += res.success;
        totalFailed += res.failed;
        if (res.errors.length > 0) allErrors.push(...res.errors);
      } catch (e) {
        totalFailed += batch.length;
        allErrors.push(e instanceof Error ? e.message : String(e));
      }
      setGenProgress({ done: Math.min(i + BATCH_SIZE, ids.length), total: ids.length, failed: totalFailed });
    }

    const errStr = totalFailed > 0 ? ` / 失敗 ${totalFailed}件${allErrors[0] ? ": " + allErrors[0].slice(0, 80) : ""}` : "";
    setMessage(`✓ ${totalSuccess}件の下書きを生成しました${errStr}`);
    setIsError(totalFailed === ids.length);
    setGenProgress(null);
    router.refresh();
  };

  const handleReset = () => {
    if (!confirm("全候補（採用済み・却下済みも含む）と関連下書きを削除して、ステータスを「下書き」に戻します。よろしいですか？")) return;
    startTransition(async () => {
      setMessage("やり直し中...");
      setIsError(false);
      const res = await resetCampaignProspects(campaign.id);
      if (res.ok) {
        setMessage(`✓ ${res.deletedCount}件の候補をクリア。CSV を投入してキャンペーン作成し直してください`);
        setIsError(false);
        router.refresh();
      } else {
        setMessage("やり直しに失敗しました");
        setIsError(true);
      }
    });
  };

  const handleDownloadCsv = () => {
    window.location.href = `/api/exports/prospects?campaignId=${campaign.id}`;
  };

  return (
    <div className="px-10 py-8 max-w-[1280px]">
      <Link href="/campaigns" className="text-[12px] text-muted hover:text-ink inline-flex items-center gap-1">
        ← キャンペーン一覧
      </Link>

      {/* ヘッダ */}
      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="font-en text-[24px] font-medium">{campaign.name}</h1>
          <div className="mt-1 text-[12.5px] text-ink-2">
            {campaign.services?.name || "サービス未指定"}
            <span className="text-muted"> / 差出人: </span>
            {campaign.sender_personas?.display_name || "未設定"}
            <span className="text-muted"> {"<"}{campaign.sender_personas?.email_from}{">"}</span>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={cn(
            "mt-4 text-[12.5px] flex items-start gap-1.5",
            isError ? "text-red-600" : "text-emerald-700"
          )}
        >
          {isError && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{message}</span>
        </div>
      )}

      {/* prospects が0件 */}
      {prospects.length === 0 && (
        <div className="mt-6 bg-card border border-border rounded-xl p-8 text-center">
          <FileSpreadsheet className="w-10 h-10 mx-auto text-muted mb-3" />
          <h2 className="font-en text-[16px] font-medium">候補リストがありません</h2>
          <p className="mt-2 text-[12.5px] text-ink-2 max-w-md mx-auto leading-relaxed">
            このキャンペーンには候補企業が0件です。<br />
            CSV を投入し直すか、新しいキャンペーンを作成してください。
          </p>
          <Link
            href="/campaigns/new"
            className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-en font-medium bg-ink text-accent hover:bg-gray-900 rounded-md"
          >
            新規キャンペーン
          </Link>
        </div>
      )}

      {/* prospects 一覧 */}
      {prospects.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <h2 className="font-en text-[18px] font-medium">
                候補企業 <span className="text-muted font-normal">({total}社)</span>
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">採用 {approved}</span>
                {drafted > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">下書き済 {drafted}</span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700">却下 {rejected}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">未レビュー {remaining}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {drafted > 0 && (
                <Link
                  href="/drafts"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-en font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-md"
                >
                  <CheckCircle className="w-3 h-3" />
                  下書きを見る
                </Link>
              )}
              <button
                onClick={handleDownloadCsv}
                disabled={pending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-en font-medium bg-gray-100 hover:bg-gray-200 rounded-md"
                title="この candidate リストを CSV ダウンロード"
              >
                <FileSpreadsheet className="w-3 h-3" />
                CSV出力
              </button>
              <button
                onClick={handleReset}
                disabled={pending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-en font-medium bg-red-50 text-red-700 hover:bg-red-100 rounded-md disabled:opacity-50"
                title="全候補削除して下書きに戻す"
              >
                <RotateCcw className="w-3 h-3" />
                やり直し
              </button>
            </div>
          </div>

          {/* 一括選択ヘルパー */}
          <SelectionHelpers prospects={prospects} />

          {/* キーボードショートカットヒント */}
          <div className="mb-2 text-[10.5px] text-muted flex items-center gap-1.5">
            <Keyboard className="w-3 h-3" />
            <span>
              キーボード:
              <kbd className="mx-1 px-1 py-0.5 bg-gray-100 border border-border rounded text-[10px] font-mono">A</kbd>採用
              <kbd className="mx-1 px-1 py-0.5 bg-gray-100 border border-border rounded text-[10px] font-mono">R</kbd>却下
              <kbd className="mx-1 px-1 py-0.5 bg-gray-100 border border-border rounded text-[10px] font-mono">E</kbd>編集
              <kbd className="mx-1 px-1 py-0.5 bg-gray-100 border border-border rounded text-[10px] font-mono">↓ ↑</kbd>移動
              <kbd className="mx-1 px-1 py-0.5 bg-gray-100 border border-border rounded text-[10px] font-mono">Space</kbd>詳細
            </span>
          </div>

          <div className="space-y-1.5">
            {prospects.map((p) => (
              <ProspectReviewCard key={p.id} prospect={p} campaignId={campaign.id} />
            ))}
          </div>

          {/* 採用社があればリスト下部にも大きな下書き生成 CTA */}
          {readyForDrafts > 0 && (
            <div className="mt-6 p-5 bg-emerald-50/70 border-2 border-emerald-200 rounded-xl">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-en text-[14px] font-medium text-emerald-900">
                    採用 {approved}社、下書きを作る準備ができました
                  </div>
                  <div className="text-[11.5px] text-emerald-800/80 mt-1">
                    AI がパーソナライズ下書きを生成します（5社ずつ並列処理、30-60秒/バッチ）
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end shrink-0">
                  <button
                    onClick={handleGenerateDrafts}
                    disabled={!!genProgress}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-en font-medium bg-emerald-700 text-white hover:bg-emerald-800 rounded-md disabled:opacity-50"
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    {genProgress ? `生成中 ${genProgress.done}/${genProgress.total}...` : `下書きを生成 (${approved}社)`}
                  </button>
                  {drafted > 0 && (
                    <Link
                      href="/drafts"
                      className="text-[11.5px] text-emerald-800 underline hover:text-emerald-900"
                    >
                      生成済みの下書きを見る →
                    </Link>
                  )}
                </div>
              </div>
              {/* 進捗バー */}
              {genProgress && (
                <div className="mt-4">
                  <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-300"
                      style={{ width: `${(genProgress.done / genProgress.total) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1.5 text-[10.5px] text-emerald-800 flex items-center justify-between">
                    <span>
                      {genProgress.done} / {genProgress.total} 社完了
                      {genProgress.failed > 0 && (
                        <span className="ml-2 text-red-700">（失敗 {genProgress.failed}件）</span>
                      )}
                    </span>
                    <span>{Math.round((genProgress.done / genProgress.total) * 100)}%</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 候補リスト上部の一括選択ヘルパー
 * - 全選択 / 全解除
 * - 未レビューだけ選択
 * - 採用済みだけ選択
 */
function SelectionHelpers({ prospects }: { prospects: any[] }) {
  const sel = useProspectSelection();
  if (!sel) return null;

  const allIds = prospects.map((p) => p.id);
  const pendingIds = prospects.filter((p) => p.status === "pending").map((p) => p.id);
  const approvedIds = prospects.filter((p) => p.status === "approved").map((p) => p.id);

  const allChecked = allIds.length > 0 && allIds.every((id) => sel.selected.has(id));

  return (
    <div className="mb-2 flex items-center gap-2 flex-wrap text-[11px]">
      <span className="text-muted">一括選択:</span>
      <button
        onClick={() => sel.toggleAll(allIds)}
        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-md font-en font-medium text-ink"
      >
        {allChecked ? "全解除" : `全選択 (${allIds.length})`}
      </button>
      {pendingIds.length > 0 && (
        <button
          onClick={() => sel.toggleAll(pendingIds)}
          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 rounded-md font-en font-medium text-amber-800"
          title="ステータスが「未レビュー」の候補だけを選択"
        >
          未レビューだけ ({pendingIds.length})
        </button>
      )}
      {approvedIds.length > 0 && (
        <button
          onClick={() => sel.toggleAll(approvedIds)}
          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 rounded-md font-en font-medium text-emerald-800"
          title="採用済みの候補だけを選択"
        >
          採用済みだけ ({approvedIds.length})
        </button>
      )}
      {sel.selected.size > 0 && (
        <button
          onClick={sel.clear}
          className="px-2.5 py-1 text-muted hover:text-ink underline"
        >
          選択解除
        </button>
      )}
    </div>
  );
}
