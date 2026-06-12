import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DraftEditor } from "@/components/drafts/DraftEditor";
import { DraftListItem } from "./DraftListItem";
import { BulkActionBar, SelectionProvider } from "./BulkActionBar";
import { PenLine } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ selected?: string }>;
}

export default async function DraftsPage({ searchParams }: Props) {
  const { selected } = await searchParams;
  const supabase = await createSupabaseServerClient();

  // 一覧用 — 送信済み (status='sent') は除外。送信ログから確認できる
  const { data: drafts } = await supabase
    .from("email_drafts")
    .select(
      "id, subject, status, generated_at, prospect_id, prospects(id, company_name, contact_method, contact_value, campaigns(id, name)), sender_personas(display_name)"
    )
    .neq("status", "sent")
    .order("generated_at", { ascending: false });

  // 選択中の詳細
  const { data: selectedDraft } = selected
    ? await supabase
        .from("email_drafts")
        .select(
          "*, prospects(*, campaigns(id, name)), sender_personas(*), services(name, resource_links, cta_url, cta_label), organizations:organization_id(name, display_address), service_templates:selected_template_id(label, length_tier, tone, structure)"
        )
        .eq("id", selected)
        .maybeSingle()
    : { data: null as any };

  if (!drafts || drafts.length === 0) {
    return (
      <div className="px-10 py-10 max-w-[1280px]">
        <div className="balencer-script text-[24px] text-muted">drafts</div>
        <h1 className="font-en text-[32px] font-medium tracking-[-.01em]">下書き一覧</h1>
        <div className="mt-8 bg-card border border-dashed border-border rounded-xl p-12 text-center">
          <PenLine className="w-8 h-8 mx-auto text-muted mb-3" />
          <div className="text-[14px] text-ink-2 font-medium">下書きがまだありません</div>
          <div className="text-[12.5px] text-muted mt-1">
            キャンペーン詳細画面で採用済み候補に対して下書きを生成してください
          </div>
        </div>
      </div>
    );
  }

  return (
    <SelectionProvider>
    <div className="px-6 py-8 max-w-[1600px]">
      <div className="flex items-center gap-3 px-4 mb-6">
        <div>
          <div className="balencer-script text-[22px] text-muted leading-none">drafts</div>
          <h1 className="font-en text-[26px] font-medium tracking-[-.01em] leading-tight">下書き一覧</h1>
        </div>
        <span className="text-[12px] text-muted ml-2">{drafts.length}件</span>
        <span className="text-[11px] text-muted ml-2">（左のチェックボックスで複数選択→一括操作）</span>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* 左：一覧 */}
        <aside className="col-span-12 lg:col-span-4 xl:col-span-3">
          <div className="bg-card border border-border rounded-xl overflow-hidden max-h-[calc(100vh-160px)] overflow-y-auto">
            <ul>
              {drafts.map((d: any) => (
                <DraftListItem key={d.id} draft={d} selected={d.id === selected} />
              ))}
            </ul>
          </div>
        </aside>

        {/* 右：詳細 */}
        <section className="col-span-12 lg:col-span-8 xl:col-span-9">
          {!selectedDraft ? (
            <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
              <PenLine className="w-8 h-8 mx-auto text-muted mb-3" />
              <div className="text-[14px] text-ink-2 font-medium">左から下書きを選択してください</div>
              <div className="text-[12.5px] text-muted mt-1">
                各下書きは1社に対して1通、送信モード（メール/フォーム）に応じて編集できます
              </div>
            </div>
          ) : (
            <DraftPanel draft={selectedDraft} />
          )}
        </section>
      </div>
      <BulkActionBar />
    </div>
    </SelectionProvider>
  );
}

function DraftPanel({ draft }: { draft: any }) {
  const isForm = draft.prospects?.contact_method === "form";
  const contactValue = draft.prospects?.contact_value;

  return (
    <div>
      {/* メイン宛先バナー（誤送信防止に超目立たせる） */}
      <div
        className={`mb-4 rounded-xl border-2 ${
          isForm
            ? "bg-amber-50 border-amber-300"
            : contactValue
            ? "bg-emerald-50 border-emerald-300"
            : "bg-red-50 border-red-300"
        } p-5`}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`text-[10px] uppercase tracking-[.14em] font-en font-medium px-2 py-1 rounded-full ${
                isForm
                  ? "bg-amber-200 text-amber-900"
                  : contactValue
                  ? "bg-emerald-200 text-emerald-900"
                  : "bg-red-200 text-red-900"
              }`}
            >
              {isForm ? "フォーム送信" : "メール送信"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-ink-2 font-medium">{draft.prospects?.company_name} へ</div>
              <div className="font-mono text-[18px] font-medium text-ink truncate" title={contactValue}>
                → {contactValue || "（連絡先未設定 — 編集してください）"}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[.14em] text-muted font-en font-medium">差出人</div>
            <div className="font-medium text-[13px] mt-0.5">{draft.sender_personas?.display_name}</div>
            <div className="font-mono text-[10.5px] text-muted">{draft.sender_personas?.email_from}</div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <div className="text-[10px] uppercase tracking-[.14em] font-en font-medium text-muted">件名</div>
        <h2 className="font-medium text-[18px] mt-1 leading-tight">{draft.subject}</h2>
      </div>
      <DraftEditor draft={draft} />
    </div>
  );
}
