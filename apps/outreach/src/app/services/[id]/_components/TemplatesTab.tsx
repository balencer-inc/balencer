"use client";

import { useState, useTransition } from "react";
import { Check, X, Star, Pencil, Save } from "lucide-react";
import { adoptTemplate, archiveTemplate, updateTemplate } from "../actions";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  label: string;
  length_tier: 300 | 500 | 700;
  tone: "formal" | "standard" | "friendly";
  structure: "problem" | "empathy" | "impact";
  subject_pattern: string;
  body_pattern: string;
  rationale: string | null;
  status: "proposed" | "adopted" | "archived";
}

interface Props {
  service: any;
  templates: Template[];
}

const TONE_LABEL: Record<string, string> = {
  formal: "フォーマル",
  standard: "標準",
  friendly: "親しみ",
};
const STRUCTURE_LABEL: Record<string, string> = {
  problem: "課題提示型",
  empathy: "共感ストーリー型",
  impact: "数字インパクト型",
};

export function TemplatesTab({ service, templates }: Props) {
  if (templates.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-10 text-center">
        <div className="text-[14px] text-ink-2">
          まだテンプレが生成されていません。
        </div>
        <div className="text-[12.5px] text-muted mt-2">
          「資料テキスト」タブで資料を投入して「AIでテンプレ生成」を押してください。
        </div>
      </div>
    );
  }

  const adopted = templates.filter((t) => t.status === "adopted");
  const proposed = templates.filter((t) => t.status === "proposed");

  return (
    <div className="space-y-8">
      {adopted.length > 0 && (
        <section>
          <h2 className="text-[14px] font-en font-medium text-ink mb-3 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 fill-current text-accent" />
            採用中のテンプレ <span className="text-muted font-normal">({adopted.length}件)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adopted.map((t) => (
              <TemplateCard key={t.id} template={t} serviceId={service.id} adopted />
            ))}
          </div>
        </section>
      )}

      {proposed.length > 0 && (
        <section>
          <h2 className="text-[14px] font-en font-medium text-ink mb-3">
            AI 提案 <span className="text-muted font-normal">({proposed.length}件)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proposed.map((t) => (
              <TemplateCard key={t.id} template={t} serviceId={service.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  serviceId,
  adopted,
}: {
  template: Template;
  serviceId: string;
  adopted?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(template.subject_pattern);
  const [body, setBody] = useState(template.body_pattern);
  const [savedMsg, setSavedMsg] = useState("");

  const onAdopt = () =>
    startTransition(async () => {
      await adoptTemplate(serviceId, template.id);
    });
  const onArchive = () =>
    startTransition(async () => {
      await archiveTemplate(serviceId, template.id);
    });
  const onSave = () =>
    startTransition(async () => {
      const res = await updateTemplate(serviceId, template.id, {
        subject_pattern: subject,
        body_pattern: body,
      });
      if (res.ok) {
        setSavedMsg("保存しました");
        setEditing(false);
        setTimeout(() => setSavedMsg(""), 2000);
      } else {
        setSavedMsg(`エラー: ${res.error || "保存失敗"}`);
      }
    });
  const onCancel = () => {
    setSubject(template.subject_pattern);
    setBody(template.body_pattern);
    setEditing(false);
  };

  return (
    <div
      className={cn(
        "bg-card border rounded-xl p-5 flex flex-col gap-3",
        adopted ? "border-ink" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-en font-medium text-[15px]">{template.label}</div>
          <div className="mt-1 flex flex-wrap gap-1.5 text-[10.5px] font-mono">
            <span className="px-2 py-0.5 rounded bg-gray-100 text-ink-2">{template.length_tier}字</span>
            <span className="px-2 py-0.5 rounded bg-gray-100 text-ink-2">{TONE_LABEL[template.tone]}</span>
            <span className="px-2 py-0.5 rounded bg-gray-100 text-ink-2">{STRUCTURE_LABEL[template.structure]}</span>
          </div>
        </div>
        {adopted && (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-ink text-accent font-mono">
            <Star className="w-2.5 h-2.5 fill-current" /> 採用中
          </span>
        )}
      </div>

      {template.rationale && (
        <div className="text-[11.5px] text-muted leading-relaxed border-l-2 border-gray-200 pl-3">
          {template.rationale}
        </div>
      )}

      <div className="border border-border rounded-md overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 border-b border-border">
          <div className="text-[10px] uppercase tracking-[.14em] font-en font-medium text-muted mb-1">
            subject {editing && "(編集中)"}
          </div>
          {editing ? (
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-[12.5px] font-medium bg-white border border-border rounded px-2 py-1 focus:outline-none focus:border-ink"
            />
          ) : (
            <div className="text-[12.5px] font-medium">{template.subject_pattern}</div>
          )}
        </div>
        <div className="p-3 max-h-[400px] overflow-y-auto">
          {editing ? (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="w-full text-[11.5px] leading-relaxed text-ink-2 font-ja bg-white border border-border rounded p-2 focus:outline-none focus:border-ink resize-y"
            />
          ) : (
            <pre className="text-[11.5px] leading-relaxed text-ink-2 whitespace-pre-wrap font-ja">
              {template.body_pattern}
            </pre>
          )}
        </div>
      </div>

      {savedMsg && (
        <div className={cn("text-[11px]", savedMsg.startsWith("エラー") ? "text-red-600" : "text-emerald-700")}>
          {savedMsg}
        </div>
      )}

      <div className="flex gap-2 mt-1 flex-wrap">
        {editing ? (
          <>
            <button
              onClick={onSave}
              disabled={pending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-en font-medium rounded-md bg-ink text-accent hover:bg-gray-900"
            >
              <Save className="w-3 h-3" />
              保存
            </button>
            <button
              onClick={onCancel}
              disabled={pending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-en font-medium rounded-md bg-gray-50 text-ink-2 hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
              キャンセル
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              disabled={pending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-en font-medium rounded-md bg-gray-50 text-ink-2 hover:bg-gray-100"
              title="件名・本文を編集"
            >
              <Pencil className="w-3 h-3" />
              編集
            </button>
            {adopted ? (
              <button
                onClick={onArchive}
                disabled={pending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-en font-medium rounded-md bg-gray-50 text-ink-2 hover:bg-gray-100"
              >
                <X className="w-3 h-3" />
                採用解除
              </button>
            ) : (
              <>
                <button
                  onClick={onAdopt}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-en font-medium rounded-md bg-ink text-accent hover:bg-gray-900"
                >
                  <Check className="w-3 h-3" />
                  採用
                </button>
                <button
                  onClick={onArchive}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-en font-medium rounded-md bg-gray-50 text-muted hover:bg-gray-100"
                >
                  <X className="w-3 h-3" />
                  破棄
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
