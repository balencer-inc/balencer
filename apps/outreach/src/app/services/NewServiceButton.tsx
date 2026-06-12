"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createService } from "./actions";
import { refreshServices } from "@/hooks/useServices";
import { cn } from "@/lib/utils";

export function NewServiceButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [pitchAxis, setPitchAxis] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-en font-medium bg-ink text-accent hover:bg-gray-900 rounded-md"
      >
        <Plus className="w-3.5 h-3.5" />
        新規サービス追加
      </button>
    );
  }

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      const res = await createService({
        name,
        slug: slug.trim() || undefined,
        pitch_axis: pitchAxis,
      });
      if (res.ok) {
        await refreshServices(); // SWRキャッシュも即更新
        router.push(`/services/${res.id}`);
        setOpen(false);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="bg-card border border-ink rounded-xl p-5 shadow-md max-w-[640px]">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="text-[10px] uppercase tracking-[.14em] font-en font-medium text-muted">
          新規サービスを追加
        </div>
        <button onClick={() => setOpen(false)} className="text-muted hover:text-ink">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-4 space-y-3">
        <Field label="サービス名 *">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: M&Aアドバイザリー"
            className="w-full px-3 py-2 text-[13px] border border-border rounded-md focus:outline-none focus:border-ink"
          />
        </Field>
        <Field label="slug（任意）" hint="URL用の英数字。空欄ならサービス名から自動生成">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="ma-advisory"
            className="w-full px-3 py-2 text-[13px] font-mono border border-border rounded-md focus:outline-none focus:border-ink"
          />
        </Field>
        <Field label="訴求軸（任意）" hint="後で編集可。空欄でも作成できる">
          <input
            value={pitchAxis}
            onChange={(e) => setPitchAxis(e.target.value)}
            placeholder="買収・売却の戦略から実行まで一気通貫で伴走"
            className="w-full px-3 py-2 text-[13px] border border-border rounded-md focus:outline-none focus:border-ink"
          />
        </Field>
      </div>

      {error && <div className="mt-3 text-[12px] text-red-600">{error}</div>}

      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
        <div className="flex-1 text-[10.5px] text-muted">
          作成後、詳細画面でCTA URL・資料テキスト・テンプレ生成を順に行います
        </div>
        <button
          onClick={() => setOpen(false)}
          className="px-3 py-2 text-[12.5px] font-en font-medium text-muted hover:text-ink"
        >
          キャンセル
        </button>
        <button
          onClick={handleCreate}
          disabled={pending || !name.trim()}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-en font-medium rounded-md",
            !pending && name.trim()
              ? "bg-ink text-accent hover:bg-gray-900"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          {pending ? "作成中..." : "作成して編集に進む"}
        </button>
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
