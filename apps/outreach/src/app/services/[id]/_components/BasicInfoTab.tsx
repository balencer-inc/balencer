"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, ExternalLink, RefreshCw } from "lucide-react";
import { saveServiceBasicInfo, generateServiceTemplates } from "../actions";
import { cn } from "@/lib/utils";

interface Props {
  service: any;
}

export function BasicInfoTab({ service }: Props) {
  const [name, setName] = useState<string>(service.name || "");
  const [pitchAxis, setPitchAxis] = useState<string>(service.pitch_axis || "");
  const [ctaLabel, setCtaLabel] = useState<string>(service.cta_label || "オンラインで15分話す");
  const [ctaUrl, setCtaUrl] = useState<string>(service.cta_url || "");
  const [numbers, setNumbers] = useState<string>(
    (service.authority_block?.numbers || []).join("\n")
  );
  const [books, setBooks] = useState<string>(
    (service.authority_block?.books || []).join("\n")
  );
  const [cases, setCases] = useState<string>(
    (service.authority_block?.cases || []).join("\n")
  );
  const router = useRouter();
  const [pending, startSaving] = useTransition();
  const [regenerating, startRegen] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setMessage(null);
    return new Promise<boolean>((resolve) => {
      startSaving(async () => {
        const res = await saveServiceBasicInfo(service.id, {
          name,
          pitch_axis: pitchAxis,
          cta_label: ctaLabel,
          cta_url: ctaUrl,
          authority_block: {
            numbers: numbers.split("\n").map((s) => s.trim()).filter(Boolean),
            books: books.split("\n").map((s) => s.trim()).filter(Boolean),
            cases: cases.split("\n").map((s) => s.trim()).filter(Boolean),
          },
        });
        if (res.ok) {
          setMessage("保存しました");
          resolve(true);
        } else {
          setMessage(`エラー: ${res.error}`);
          resolve(false);
        }
      });
    });
  };

  const handleSaveAndRegen = async () => {
    if (!confirm("基本情報を保存してから、AIにテンプレ候補を再生成させます。現在のテンプレ提案は新しいものに置き換わります（採用済みは維持）。よろしいですか？")) return;
    const saved = await handleSave();
    if (!saved) return;
    setMessage("AIがテンプレを最新情報で再生成中...（30-60秒）");
    startRegen(async () => {
      const res = await generateServiceTemplates(service.id);
      if (res.ok) {
        setMessage(`✓ 保存+テンプレ${res.count}案を再生成しました。「テンプレ候補」タブで確認してください`);
        // 画面を再フェッチして新しいテンプレを反映
        router.refresh();
      } else {
        setMessage(`エラー: ${res.error}`);
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* 基本 */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="text-[10px] uppercase tracking-[.16em] font-en font-medium text-muted mb-3">
          基本情報
        </div>
        <div className="space-y-4">
          <Field label="サービス名">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-[13px] border border-border rounded-md focus:outline-none focus:border-ink"
            />
          </Field>
          <Field label="訴求軸（短文）" hint="メール本文の方向性を決める一行">
            <input
              value={pitchAxis}
              onChange={(e) => setPitchAxis(e.target.value)}
              placeholder="AI社員に指示する体験を核に、業態を分析→実装→運用→ナレッジ化まで一気通貫"
              className="w-full px-3 py-2 text-[13px] border border-border rounded-md focus:outline-none focus:border-ink"
            />
          </Field>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="text-[10px] uppercase tracking-[.16em] font-en font-medium text-muted mb-3">
          オンライン会議枠（CTA）
        </div>
        <p className="text-[12px] text-ink-2 mb-4 leading-relaxed">
          メール末尾に挿入される予約リンク。TidyCal / Calendly / Google Calendar の予約URLを貼ってください。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="ボタンラベル">
            <input
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="オンラインで15分話す"
              className="w-full px-3 py-2 text-[13px] border border-border rounded-md focus:outline-none focus:border-ink"
            />
          </Field>
          <div className="md:col-span-2">
            <label className="block text-[11px] font-medium text-muted mb-1.5">予約URL</label>
            <div className="flex gap-2">
              <input
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://tidycal.com/balencer/15min"
                className="flex-1 px-3 py-2 text-[12.5px] font-mono border border-border rounded-md focus:outline-none focus:border-ink"
              />
              {ctaUrl && (
                <a
                  href={ctaUrl}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1 px-3 py-2 text-[11.5px] text-muted hover:text-ink border border-border rounded-md"
                >
                  <ExternalLink className="w-3 h-3" />
                  開く
                </a>
              )}
            </div>
            <div className="mt-1 text-[10.5px] text-muted/80">
              未設定だとメールに「下記URLからご都合をお選びください」と仮置きされます
            </div>
          </div>
        </div>
      </div>

      {/* 権威性 */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="text-[10px] uppercase tracking-[.16em] font-en font-medium text-muted mb-3">
          権威性データ
        </div>
        <p className="text-[12px] text-ink-2 mb-4 leading-relaxed">
          メール本文中にさりげなく挿入される数字・著書・事例。1行1項目で記入してください。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="数字・実績" hint="例: 創業以来12年連続黒字">
            <textarea
              value={numbers}
              onChange={(e) => setNumbers(e.target.value)}
              rows={5}
              placeholder="創業以来12年連続黒字&#10;関西の中小企業60社超で導入&#10;平均業務時間削減40%+"
              className="w-full px-3 py-2 text-[12px] border border-border rounded-md focus:outline-none focus:border-ink resize-y"
            />
          </Field>
          <Field label="著書" hint="例: 〇〇出版「△△」">
            <textarea
              value={books}
              onChange={(e) => setBooks(e.target.value)}
              rows={5}
              placeholder="阿部による著書3冊（中小企業の経営再生）"
              className="w-full px-3 py-2 text-[12px] border border-border rounded-md focus:outline-none focus:border-ink resize-y"
            />
          </Field>
          <Field label="事例" hint="例: 〇〇社、△△業界での成功事例">
            <textarea
              value={cases}
              onChange={(e) => setCases(e.target.value)}
              rows={5}
              placeholder="製造業A社：顧客対応時間80%削減&#10;サービス業B社：レポート作成95%削減"
              className="w-full px-3 py-2 text-[12px] border border-border rounded-md focus:outline-none focus:border-ink resize-y"
            />
          </Field>
        </div>
      </div>

      {/* アクション */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className={cn("text-[12.5px] flex-1 min-w-[200px]", message?.startsWith("エラー") ? "text-red-600" : "text-emerald-700")}>
          {message}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleSave}
            disabled={pending || regenerating}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-en font-medium bg-gray-100 text-ink hover:bg-gray-200 rounded-md disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {pending ? "保存中..." : "基本情報を保存"}
          </button>
          <button
            onClick={handleSaveAndRegen}
            disabled={pending || regenerating}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-en font-medium rounded-md transition-colors",
              regenerating
                ? "bg-amber-100 text-amber-900 cursor-wait"
                : "bg-ink text-accent hover:bg-gray-900"
            )}
            title="保存してからテンプレ候補を最新情報で再生成"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", regenerating && "animate-spin")} />
            {regenerating ? "AI再生成中..." : "保存 + テンプレ再生成"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted mb-1.5">{label}</label>
      {children}
      {hint && <div className="mt-1 text-[10.5px] text-muted/80">{hint}</div>}
    </div>
  );
}
