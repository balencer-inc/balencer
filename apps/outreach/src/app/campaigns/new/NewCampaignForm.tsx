"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createCampaign } from "../actions";
import { cn } from "@/lib/utils";
import { Building2, Users, Hash, AlertCircle, Loader2, FileSpreadsheet, ExternalLink, Briefcase } from "lucide-react";
import { useServices } from "@/hooks/useServices";
import { useSenderPersonas } from "@/hooks/useSenderPersonas";
import { useOrganizations } from "@/hooks/useOrganizations";

export function NewCampaignForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { organizations, isLoading: orgsLoading } = useOrganizations();
  const { services, isLoading: servicesLoading } = useServices();
  const { senders, isLoading: sendersLoading } = useSenderPersonas();

  const [orgId, setOrgId] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>("");
  const [senderId, setSenderId] = useState<string>("");
  const [name, setName] = useState("");
  const [csvFilename, setCsvFilename] = useState("");
  const [csvContent, setCsvContent] = useState("");

  // 選択中の組織に紐づくサービス・差出人のみ
  const filteredServices = orgId ? services.filter((s) => s.organization_id === orgId) : services;
  const filteredSenders = orgId ? senders.filter((s) => s.organization_id === orgId) : senders;

  const handleCsvFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFilename(file.name);
    const text = await file.text();
    setCsvContent(text);
  };

  // 最初の組織を初期選択
  useEffect(() => {
    if (organizations.length > 0 && !orgId) setOrgId(organizations[0].id);
  }, [organizations, orgId]);

  // 組織が変わったらサービス・差出人を再選択（その組織のもので初期化）
  useEffect(() => {
    if (filteredServices.length > 0) {
      // 現在の serviceId が新しい組織のサービスに含まれていなければ先頭に切り替え
      if (!filteredServices.some((s) => s.id === serviceId)) {
        setServiceId(filteredServices[0].id);
      }
    } else {
      setServiceId("");
    }
  }, [orgId, filteredServices, serviceId]);

  useEffect(() => {
    if (filteredSenders.length > 0) {
      if (!filteredSenders.some((s) => s.id === senderId)) {
        setSenderId(filteredSenders[0].id);
      }
    } else {
      setSenderId("");
    }
  }, [orgId, filteredSenders, senderId]);

  const selectedService = filteredServices.find((s) => s.id === serviceId);
  const adoptedCount = selectedService?.active_template_ids?.length || 0;
  const hasMaterial = !!selectedService?.source_material;

  // CSV の行数をプレビュー（ヘッダ除く）
  const csvRowCount = csvContent ? Math.max(0, csvContent.split(/\n/).filter((l) => l.trim()).length - 1) : 0;

  const canSubmit = serviceId && senderId && hasMaterial && adoptedCount > 0 && csvContent;

  const autoName = name || (selectedService ? `${selectedService.name} × ${csvFilename || "リスト"}` : "新規キャンペーン");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit) {
      if (!hasMaterial) setError("選択したサービスに資料テキストが未投入です");
      else if (adoptedCount === 0) setError("選択したサービスに採用テンプレがありません");
      else if (!csvContent) setError("CSV ファイルをアップロードしてください");
      return;
    }
    startTransition(async () => {
      const res = await createCampaign({
        name: autoName,
        service_id: serviceId,
        sender_persona_id: senderId,
        csv_filename: csvFilename,
        csv_content: csvContent,
      });
      if (res.ok) {
        const past = res.skippedPastSent?.length || 0;
        const qs = past > 0 ? `?skipped_past_sent=${past}` : "";
        router.push(`/campaigns/${res.id}${qs}`);
      } else {
        setError(res.error);
      }
    });
  };

  if (servicesLoading || sendersLoading) {
    return (
      <div className="mt-8 bg-card border border-border rounded-xl p-12 text-center text-muted text-[12.5px]">
        <Loader2 className="w-5 h-5 mx-auto animate-spin mb-2" />
        サービス・差出人情報を読み込み中...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      {/* 組織切り替え（バレンサー / TSUGI 等） */}
      <Card>
        <SectionTitle icon={Briefcase} label="送信元組織" />
        <div className="flex gap-2 flex-wrap">
          {organizations.length === 0 && (
            <div className="text-[12.5px] text-muted">組織が登録されていません</div>
          )}
          {organizations.map((o) => (
            <button
              type="button"
              key={o.id}
              onClick={() => setOrgId(o.id)}
              className={cn(
                "px-4 py-2 text-[13px] font-en font-medium rounded-md border-2 transition-all",
                orgId === o.id
                  ? "bg-ink text-accent border-ink"
                  : "bg-white text-ink border-border hover:border-ink"
              )}
            >
              {o.name}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-muted mt-2">
          選択した組織のサービス・差出人だけが下に表示されます
        </div>
      </Card>

      {/* サービス */}
      <Card>
        <SectionTitle icon={Building2} label="サービス" />
        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="w-full px-3 py-2 text-[13px] border border-border rounded-md focus:outline-none focus:border-ink"
        >
          {filteredServices.length === 0 && <option value="">（この組織のサービスがありません）</option>}
          {filteredServices.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {selectedService && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge ok={hasMaterial}>{hasMaterial ? "資料テキスト投入済" : "資料テキスト未投入"}</Badge>
            <Badge ok={adoptedCount > 0}>{adoptedCount > 0 ? `採用テンプレ ${adoptedCount}件` : "採用テンプレなし"}</Badge>
          </div>
        )}
      </Card>

      {/* 差出人 */}
      <Card>
        <SectionTitle icon={Users} label="差出人ペルソナ" />
        <select
          value={senderId}
          onChange={(e) => setSenderId(e.target.value)}
          className="w-full px-3 py-2 text-[13px] border border-border rounded-md focus:outline-none focus:border-ink"
        >
          {filteredSenders.length === 0 && <option value="">（この組織の差出人がありません）</option>}
          {filteredSenders.map((s) => (
            <option key={s.id} value={s.id}>
              {s.display_name} {"<"}{s.email_from}{">"}
            </option>
          ))}
        </select>
      </Card>

      {/* キャンペーン名 */}
      <Card>
        <SectionTitle icon={Hash} label="キャンペーン名（任意）" />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={autoName}
          className="w-full px-3 py-2 text-[13px] border border-border rounded-md focus:outline-none focus:border-ink"
        />
      </Card>

      {/* 候補リスト CSV */}
      <Card>
        <SectionTitle icon={FileSpreadsheet} label="候補リスト（CSV）" />
        <p className="text-[11.5px] text-ink-2 mb-3 leading-relaxed">
          リストは Claude Code 等の外部ツールで実在性と質を確認した上で CSV にして投入してください。
          必須列: <code className="bg-gray-100 px-1 rounded">company_name, url</code>、任意: <code className="bg-gray-100 px-1 rounded">industry, area, employee_hint, note</code>。
          (UTF-8、BOM 検出済み)。
        </p>
        <div className="space-y-2">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvFile}
            className="block text-[12.5px] file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-ink file:text-accent file:text-[12px] file:font-en file:font-medium hover:file:bg-gray-900"
          />
          {csvFilename && (
            <div className="text-[11.5px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">
              ✓ {csvFilename} 読込済み（約 {csvRowCount} 行）
            </div>
          )}
          <details className="text-[10.5px] text-muted">
            <summary className="cursor-pointer hover:text-ink">CSV のサンプルを見る</summary>
            <pre className="mt-1 p-2 bg-gray-50 rounded font-mono text-[10px] overflow-x-auto">
{`company_name,url,industry,area,employee_hint,note
株式会社○○製作所,https://example.co.jp,製造業,大阪府,30名,大阪ものづくり優良企業賞2024受賞
有限会社△△工業,https://example2.co.jp,製造業,大阪府,15名,`}
            </pre>
          </details>
          <div className="text-[10.5px] text-muted leading-relaxed pt-1">
            💡 リスト作成は Claude Code が便利です。<code className="bg-gray-100 px-1 rounded">docs/outreach-claude-code-extraction.md</code> にプロンプト例があります（gBizINFO API + 優良企業ランキング集）。
          </div>
        </div>
      </Card>

      {error && (
        <div className="text-[12px] text-red-600 flex items-start gap-1.5 px-1">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={!canSubmit || pending}
          className={cn(
            "inline-flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-en font-medium rounded-md transition-colors",
            canSubmit && !pending
              ? "bg-ink text-accent hover:bg-gray-900"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          )}
        >
          {pending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> 作成中...
            </>
          ) : (
            <>キャンペーン作成 →</>
          )}
        </button>
      </div>
    </form>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-card border border-border rounded-xl p-5">{children}</div>;
}

function SectionTitle({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-muted" />
      <h2 className="font-en text-[14px] font-medium">{label}</h2>
    </div>
  );
}

function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "text-[10.5px] px-2 py-0.5 rounded-full font-mono",
        ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
      )}
    >
      {children}
    </span>
  );
}
