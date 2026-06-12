"use client";

import { useState, useTransition } from "react";
import { Save, Sparkles, Eye, Pencil } from "lucide-react";
import { saveServiceMaterial, generateServiceTemplates } from "../actions";
import { cn } from "@/lib/utils";

interface Props {
  service: any;
}

export function MaterialTab({ service }: Props) {
  const [material, setMaterial] = useState<string>(service.source_material || "");
  const [industries, setIndustries] = useState<string>(
    (service.target_audience?.industries || []).join(", ")
  );
  const [companySizes, setCompanySizes] = useState<string>(
    (service.target_audience?.company_sizes || []).join(", ")
  );
  const [jobTitles, setJobTitles] = useState<string>(
    (service.target_audience?.job_titles || []).join(", ")
  );
  const [showPreview, setShowPreview] = useState(false);
  const [saving, startSaving] = useTransition();
  const [generating, startGenerating] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const isDirty =
    material !== (service.source_material || "") ||
    industries !== (service.target_audience?.industries || []).join(", ") ||
    companySizes !== (service.target_audience?.company_sizes || []).join(", ") ||
    jobTitles !== (service.target_audience?.job_titles || []).join(", ");

  const handleSave = () => {
    setMessage(null);
    startSaving(async () => {
      const targetAudience = {
        industries: industries.split(",").map((s) => s.trim()).filter(Boolean),
        company_sizes: companySizes.split(",").map((s) => s.trim()).filter(Boolean),
        job_titles: jobTitles.split(",").map((s) => s.trim()).filter(Boolean),
      };
      const res = await saveServiceMaterial(service.id, material, targetAudience);
      setMessage(res.ok ? "保存しました" : `エラー: ${res.error}`);
    });
  };

  const handleGenerate = () => {
    if (isDirty) {
      setMessage("先に保存してください");
      return;
    }
    if (!material.trim()) {
      setMessage("資料テキストを入れてください");
      return;
    }
    setMessage("AIがテンプレを生成中...（30-60秒かかります）");
    startGenerating(async () => {
      const res = await generateServiceTemplates(service.id);
      if (res.ok) {
        setMessage(`✓ ${res.count}案を生成しました。「テンプレ候補」タブで確認してください`);
      } else {
        setMessage(`エラー: ${res.error}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 想定読者の指定 */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="text-[10px] uppercase tracking-[.16em] font-en font-medium text-muted mb-3">
          想定読者
        </div>
        <p className="text-[12px] text-ink-2 mb-4 leading-relaxed">
          AIがテンプレを生成する際の読者プロファイル。カンマ区切りで複数指定可。空欄でも生成可能（汎用設計になる）。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-muted mb-1.5">業種</label>
            <input
              value={industries}
              onChange={(e) => setIndustries(e.target.value)}
              placeholder="製造業, IT・SaaS, 物流"
              className="w-full px-3 py-2 text-[13px] border border-border rounded-md focus:outline-none focus:border-ink"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted mb-1.5">企業規模</label>
            <input
              value={companySizes}
              onChange={(e) => setCompanySizes(e.target.value)}
              placeholder="30-100名, 100-300名"
              className="w-full px-3 py-2 text-[13px] border border-border rounded-md focus:outline-none focus:border-ink"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted mb-1.5">読者の職位</label>
            <input
              value={jobTitles}
              onChange={(e) => setJobTitles(e.target.value)}
              placeholder="代表取締役, 経営企画"
              className="w-full px-3 py-2 text-[13px] border border-border rounded-md focus:outline-none focus:border-ink"
            />
          </div>
        </div>
      </div>

      {/* 資料テキスト本体 */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[.16em] font-en font-medium text-muted">
            資料テキスト
          </div>
          <button
            onClick={() => setShowPreview((s) => !s)}
            className="inline-flex items-center gap-1.5 text-[11px] font-en font-medium text-muted hover:text-ink"
          >
            {showPreview ? <Pencil className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? "編集に戻る" : "プレビュー"}
          </button>
        </div>
        <p className="text-[12px] text-ink-2 mb-4 leading-relaxed">
          サービスの説明資料、スライド原稿、Notion ページの内容などを貼り付け。
          Markdown 可。AIはこの全文を読んでテンプレを生成します。
        </p>

        {showPreview ? (
          <div className="prose prose-sm max-w-none p-4 bg-gray-50 border border-border rounded-md min-h-[400px] whitespace-pre-wrap text-[13px] leading-relaxed font-ja">
            {material || <span className="text-muted">（プレビューする内容がありません）</span>}
          </div>
        ) : (
          <textarea
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="ここにサービスの資料テキストを貼り付け..."
            className="w-full min-h-[400px] p-4 text-[13px] leading-relaxed border border-border rounded-md font-mono focus:outline-none focus:border-ink resize-y"
          />
        )}

        <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
          <span>{material.length} 文字</span>
          {service.source_material_updated_at && (
            <span>最終更新: {new Date(service.source_material_updated_at).toLocaleString("ja-JP")}</span>
          )}
        </div>
      </div>

      {/* アクション */}
      <div className="flex items-center justify-between gap-4">
        <div className={cn("text-[12.5px]", message?.startsWith("エラー") ? "text-red-600" : "text-ink-2")}>
          {message}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-en font-medium rounded-md transition-colors",
              isDirty
                ? "bg-gray-100 text-ink hover:bg-gray-200"
                : "bg-gray-50 text-muted cursor-not-allowed"
            )}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "保存中..." : "保存"}
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || saving}
            className={cn(
              "inline-flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-en font-medium rounded-md transition-colors",
              !generating && !saving
                ? "bg-ink text-accent hover:bg-gray-900"
                : "bg-gray-200 text-gray-500 cursor-wait"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {generating ? "AI生成中..." : "AIでテンプレ生成"}
          </button>
        </div>
      </div>
    </div>
  );
}
