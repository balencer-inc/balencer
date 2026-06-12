import Link from "next/link";
import { Suspense } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ChevronRight, Plus, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft: { label: "下書き", color: "bg-gray-100 text-gray-700" },
  researching: { label: "リサーチ中", color: "bg-amber-100 text-amber-800" },
  reviewing: { label: "レビュー中", color: "bg-blue-100 text-blue-800" },
  sending: { label: "送信中", color: "bg-emerald-100 text-emerald-800" },
  done: { label: "完了", color: "bg-ink text-accent" },
  archived: { label: "アーカイブ", color: "bg-gray-50 text-gray-500" },
};

export default function HomePage() {
  return (
    <div className="px-10 py-10 max-w-[1280px]">
      {/* ヘッダは即時表示 */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="balencer-script text-[26px] text-muted">welcome</div>
          <h1 className="font-en text-[32px] font-medium tracking-[-.01em] leading-tight">
            ダッシュボード
          </h1>
        </div>
        <Link
          href="/campaigns/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-en font-medium bg-ink text-accent hover:bg-gray-900 rounded-md"
        >
          <Plus className="w-3.5 h-3.5" />
          新規キャンペーン
        </Link>
      </div>

      {/* 各セクションを並列ストリーミング: 重いクエリで遅い1つに引っ張られない */}
      <section className="mt-8">
        <div className="text-[10px] uppercase tracking-[.16em] font-en font-medium text-muted mb-3">
          Next Action
        </div>
        <Suspense fallback={<SkeletonTiles />}>
          <NextActionSection />
        </Suspense>
      </section>

      <section className="mt-10">
        <div className="text-[10px] uppercase tracking-[.16em] font-en font-medium text-muted mb-3 flex items-center justify-between">
          <span>This Month</span>
          <Link href="/sends" className="text-[11px] normal-case tracking-normal text-muted hover:text-ink">
            送信ログ詳細 →
          </Link>
        </div>
        <Suspense fallback={<SkeletonMetrics />}>
          <MonthMetricsSection />
        </Suspense>
      </section>

      <section className="mt-10">
        <div className="text-[10px] uppercase tracking-[.16em] font-en font-medium text-muted mb-3 flex items-center justify-between">
          <span>Active Campaigns</span>
          <Link href="/campaigns" className="text-[11px] normal-case tracking-normal text-muted hover:text-ink">
            全キャンペーン →
          </Link>
        </div>
        <Suspense fallback={<SkeletonCampaigns />}>
          <ActiveCampaignsSection />
        </Suspense>
      </section>
    </div>
  );
}

async function NextActionSection() {
  const supabase = await createSupabaseServerClient();
  const { data: allProspects } = await supabase
    .from("prospects")
    .select("id, status, pipeline_stage, replied_at")
    .neq("status", "rejected");

  const pendingReview = (allProspects || []).filter(
    (p: any) => p.status === "pending" || p.status === "reviewed"
  ).length;
  const approvedNoDraft = (allProspects || []).filter((p: any) => p.status === "approved").length;
  const draftNoSend = (allProspects || []).filter(
    (p: any) => p.status === "drafted" && p.pipeline_stage === "not_sent"
  ).length;
  const repliedNotHandled = (allProspects || []).filter(
    (p: any) => p.replied_at && p.pipeline_stage === "replied"
  ).length;

  const hasAnyAction = pendingReview > 0 || approvedNoDraft > 0 || draftNoSend > 0 || repliedNotHandled > 0;

  if (!hasAnyAction) {
    return (
      <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
        <div className="text-[14px] font-medium text-ink-2">対応待ちはありません</div>
        <div className="text-[12px] text-muted mt-1">
          新規キャンペーンを作るか、進捗を確認してください
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <ActionTile
        count={pendingReview}
        label="未レビュー候補"
        hint="候補を採用/却下する"
        href="/campaigns"
        tone={pendingReview > 0 ? "active" : "idle"}
      />
      <ActionTile
        count={approvedNoDraft}
        label="下書き未生成"
        hint="採用した候補に下書きを作る"
        href="/campaigns"
        tone={approvedNoDraft > 0 ? "active" : "idle"}
      />
      <ActionTile
        count={draftNoSend}
        label="未送信の下書き"
        hint="承認して送信する"
        href="/drafts"
        tone={draftNoSend > 0 ? "active" : "idle"}
      />
      <ActionTile
        count={repliedNotHandled}
        label="返信あり 未対応"
        hint="商談化を進める"
        href="/pipeline?stage=replied"
        tone={repliedNotHandled > 0 ? "highlight" : "idle"}
      />
    </div>
  );
}

async function MonthMetricsSection() {
  const supabase = await createSupabaseServerClient();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartIso = monthStart.toISOString();

  const [{ data: monthSends }, { data: monthEvents }, { data: monthReplies }] = await Promise.all([
    supabase.from("sends").select("id, sent_at, status").gte("sent_at", monthStartIso),
    supabase.from("events").select("type, send_id").gte("occurred_at", monthStartIso),
    supabase.from("prospects").select("id").gte("replied_at", monthStartIso),
  ]);

  const monthSendCount = (monthSends || []).filter((s: any) => s.status === "sent").length;
  const monthOpened = new Set((monthEvents || []).filter((e: any) => e.type === "opened").map((e: any) => e.send_id)).size;
  const monthClicked = new Set((monthEvents || []).filter((e: any) => e.type === "clicked").map((e: any) => e.send_id)).size;
  const monthReplied = (monthReplies || []).length;

  const openRate = monthSendCount > 0 ? Math.round((monthOpened / monthSendCount) * 100) : 0;
  const clickRate = monthSendCount > 0 ? Math.round((monthClicked / monthSendCount) * 100) : 0;
  const replyRate = monthSendCount > 0 ? Math.round((monthReplied / monthSendCount) * 100) : 0;

  return (
    <div className="bg-card border border-border rounded-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
      <Metric label="送信数" value={monthSendCount} unit="通" />
      <Metric label="開封率" value={openRate} unit="%" sub={`${monthOpened}/${monthSendCount}`} />
      <Metric label="クリック率" value={clickRate} unit="%" sub={`${monthClicked}/${monthSendCount}`} />
      <Metric label="返信率" value={replyRate} unit="%" sub={`${monthReplied}/${monthSendCount}`} highlight />
    </div>
  );
}

async function ActiveCampaignsSection() {
  const supabase = await createSupabaseServerClient();

  const [{ data: campaigns }, { data: allProspects }] = await Promise.all([
    supabase
      .from("campaigns")
      .select(
        "id, name, status, created_at, industry, area, services(name), sender_personas(display_name)"
      )
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("prospects").select("status, campaign_id"),
  ]);

  const campaignStats: Record<string, { pendingReview: number; approvedNoDraft: number; total: number }> = {};
  for (const p of allProspects || []) {
    const cid = (p as any).campaign_id;
    if (!cid) continue;
    if (!campaignStats[cid]) campaignStats[cid] = { pendingReview: 0, approvedNoDraft: 0, total: 0 };
    campaignStats[cid].total++;
    if ((p as any).status === "pending" || (p as any).status === "reviewed") campaignStats[cid].pendingReview++;
    if ((p as any).status === "approved") campaignStats[cid].approvedNoDraft++;
  }

  const sortedCampaigns = (campaigns || [])
    .map((c: any) => ({ ...c, stats: campaignStats[c.id] || { pendingReview: 0, approvedNoDraft: 0, total: 0 } }))
    .sort((a, b) => {
      const aAction = a.stats.pendingReview + a.stats.approvedNoDraft;
      const bAction = b.stats.pendingReview + b.stats.approvedNoDraft;
      if (aAction !== bAction) return bAction - aAction;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 6);

  if (sortedCampaigns.length === 0) {
    return (
      <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
        <div className="text-[14px] font-medium text-ink-2">キャンペーンがまだありません</div>
        <Link
          href="/campaigns/new"
          className="mt-3 inline-flex items-center gap-1 text-[12px] text-blue-700 hover:underline"
        >
          最初のキャンペーンを作る <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedCampaigns.map((c: any) => {
        const st = STATUS_LABEL[c.status] || STATUS_LABEL.draft;
        const actionNum = c.stats.pendingReview + c.stats.approvedNoDraft;
        return (
          <Link
            key={c.id}
            href={`/campaigns/${c.id}`}
            className="block bg-card border border-border rounded-xl p-4 hover:shadow-sm hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-[13.5px] truncate">{c.name}</h3>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-mono", st.color)}>
                    {st.label}
                  </span>
                  {actionNum > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-100 text-amber-900">
                      要対応 {actionNum}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[11px] text-muted flex flex-wrap gap-x-2 gap-y-0.5">
                  <span>{c.services?.name}</span>
                  <span>· {c.sender_personas?.display_name}</span>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-4 text-[11px] shrink-0">
                <MiniStat label="候補" value={c.stats.total} />
                <MiniStat label="未レビュー" value={c.stats.pendingReview} color={c.stats.pendingReview > 0 ? "text-amber-700" : undefined} />
                <MiniStat label="未下書き" value={c.stats.approvedNoDraft} color={c.stats.approvedNoDraft > 0 ? "text-amber-700" : undefined} />
              </div>
              <ChevronRight className="w-4 h-4 text-muted shrink-0" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ActionTile({
  count,
  label,
  hint,
  href,
  tone,
}: {
  count: number;
  label: string;
  hint: string;
  href: string;
  tone: "idle" | "active" | "highlight";
}) {
  const styles =
    tone === "highlight"
      ? "border-purple-300 bg-purple-50/60 hover:bg-purple-50 text-purple-900"
      : tone === "active"
      ? "border-amber-300 bg-amber-50/40 hover:bg-amber-50 text-amber-900"
      : "border-border bg-card hover:bg-gray-50 text-muted";
  const isActive = tone !== "idle";
  return (
    <Link href={href} className={cn("block rounded-xl border p-5 transition-colors", styles)}>
      <div className="flex items-baseline gap-1.5">
        <span className={cn("font-en font-medium text-[32px] leading-none", isActive ? "" : "text-gray-400")}>
          {count}
        </span>
        <span className={cn("text-[10.5px]", isActive ? "" : "text-gray-400")}>件</span>
      </div>
      <div className="mt-2 font-medium text-[12.5px]">{label}</div>
      <div className="mt-0.5 text-[11px] opacity-70">{hint}</div>
    </Link>
  );
}

function Metric({
  label,
  value,
  unit,
  sub,
  highlight,
}: {
  label: string;
  value: number;
  unit: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] text-muted">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={cn("font-en font-medium text-[32px] leading-none", highlight ? "text-ink" : "text-ink")}>
          {value}
        </span>
        <span className="text-[12px] text-muted">{unit}</span>
      </div>
      {sub && <div className="mt-1 text-[10.5px] text-muted font-mono">{sub}</div>}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="text-right min-w-[44px]">
      <div className="text-[9px] uppercase tracking-[.14em] font-en text-muted">{label}</div>
      <div className={cn("font-en font-medium text-[13.5px]", color || "text-ink")}>{value}</div>
    </div>
  );
}

// === Skeleton fallbacks ===

function SkeletonTiles() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-gray-50 p-5 animate-pulse h-[112px]" />
      ))}
    </div>
  );
}

function SkeletonMetrics() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <div className="h-2.5 w-12 bg-gray-200 rounded" />
          <div className="mt-2 h-8 w-16 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

function SkeletonCampaigns() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-gray-50 p-4 h-[68px]" />
      ))}
    </div>
  );
}
