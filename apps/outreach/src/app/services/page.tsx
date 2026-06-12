import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Package, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { NewServiceButton } from "./NewServiceButton";

export const dynamic = "force-dynamic";

interface Service {
  id: string;
  slug: string;
  name: string;
  pitch_axis: string | null;
  source_material: string | null;
  active_template_ids: string[];
  authority_block: { numbers?: string[]; books?: string[]; cases?: string[] };
  cta_url: string | null;
}

export default async function ServicesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: services, error } = await supabase
    .from("services")
    .select("id, slug, name, pitch_axis, source_material, active_template_ids, authority_block, cta_url")
    .eq("active", true)
    .order("name");

  return (
    <div className="px-10 py-10 max-w-[1080px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="balencer-script text-[24px] text-muted">services</div>
          <h1 className="font-en text-[32px] font-medium tracking-[-.01em]">サービスマスター</h1>
          <p className="mt-3 text-[13px] text-ink-2 max-w-[620px] leading-relaxed">
            売り込むサービスごとに、資料テキスト・想定読者・テンプレ・リソースリンクを管理します。
            資料を投入するとAIが3-4種のメールテンプレ案を提案します。
          </p>
        </div>
        <NewServiceButton />
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-[13px] text-red-700">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4" />
            Supabase 接続エラー
          </div>
          <pre className="mt-2 text-[11px] text-red-600 whitespace-pre-wrap">{error.message}</pre>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {(services as Service[] | null)?.map((s) => {
          const adoptedCount = (s.active_template_ids || []).length;
          const hasSourceMaterial = !!s.source_material;
          const hasCta = !!s.cta_url;
          return (
            <Link
              key={s.id}
              href={`/services/${s.id}`}
              className="block bg-card border border-border rounded-xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-ink text-accent flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-en text-[18px] font-medium">{s.name}</h2>
                    <code className="text-[11px] text-muted bg-gray-50 px-1.5 py-0.5 rounded font-mono">{s.slug}</code>
                  </div>
                  {s.pitch_axis && (
                    <p className="mt-2 text-[13px] text-ink-2 leading-relaxed">{s.pitch_axis}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Status ok={hasSourceMaterial} label={hasSourceMaterial ? "資料テキスト投入済" : "資料テキスト未投入"} />
                    <Status ok={adoptedCount > 0} label={`採用テンプレ ${adoptedCount}件`} />
                    <Status ok={hasCta} label={hasCta ? "CTA設定済" : "CTA URL未設定"} />
                  </div>
                  {s.authority_block?.numbers && s.authority_block.numbers.length > 0 && (
                    <div className="mt-4 text-[11.5px] text-muted">
                      権威性: {s.authority_block.numbers.join(" / ")}
                      {s.authority_block.books && s.authority_block.books.length > 0 &&
                        " / " + s.authority_block.books.join(" / ")}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted shrink-0 mt-2" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 bg-card border border-border rounded-xl p-6">
        <div className="text-[10px] uppercase tracking-[.16em] font-en font-medium text-muted">
          coming next
        </div>
        <div className="mt-2 font-en text-[16px] font-medium">
          資料テキスト投入＋テンプレ生成UI（実装タスク #6-#10）
        </div>
        <p className="mt-3 text-[12.5px] text-ink-2 leading-relaxed">
          サービスをクリックすると詳細編集画面を開ける機能を次に実装します。
          そこで資料テキストを貼り付けると、AIが「長さ × トーン × 構成」を掛けた3-4種のメールテンプレ案を提案します。
        </p>
      </div>
    </div>
  );
}

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-medium ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
      }`}
    >
      <CheckCircle2 className={`w-3 h-3 ${ok ? "" : "opacity-30"}`} />
      {label}
    </span>
  );
}
