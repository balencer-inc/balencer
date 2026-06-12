"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, GripVertical, Save, Link2 } from "lucide-react";
import { saveResourceLinks } from "../actions";
import { cn } from "@/lib/utils";

interface ResourceLink {
  id?: string;
  label: string;
  url: string;
  type: "slide" | "notion" | "pdf" | "web";
  insert_mode: "always" | "optional";
  context_hint?: string;
}

interface Props {
  service: any;
}

const TYPE_LABEL: Record<string, string> = {
  slide: "スライド",
  notion: "Notion",
  pdf: "PDF",
  web: "Webページ",
};

export function ResourcesTab({ service }: Props) {
  const [links, setLinks] = useState<ResourceLink[]>(
    (service.resource_links as ResourceLink[]) || []
  );
  const [saving, startSaving] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const addLink = () =>
    setLinks([...links, { label: "", url: "", type: "slide", insert_mode: "optional", context_hint: "" }]);

  const updateLink = (i: number, key: keyof ResourceLink, value: string) => {
    const next = [...links];
    (next[i] as any)[key] = value;
    setLinks(next);
  };

  const removeLink = (i: number) => setLinks(links.filter((_, idx) => idx !== i));

  const handleSave = () => {
    setMessage(null);
    const invalid = links.find((l) => !l.label || !l.url);
    if (invalid) {
      setMessage("ラベルとURLは必須です");
      return;
    }
    startSaving(async () => {
      const res = await saveResourceLinks(service.id, links);
      setMessage(res.ok ? "保存しました" : `エラー: ${res.error}`);
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="text-[10px] uppercase tracking-[.16em] font-en font-medium text-muted mb-2">
          リソースリンク
        </div>
        <p className="text-[12px] text-ink-2 leading-relaxed">
          メール本文に埋め込みたいスライドURLや Notion ページなど。「常に挿入」を選ぶと AI が必ず本文に1回登場させ、「任意挿入」は文脈に合うときだけ AI が自然に織り込みます。
        </p>
      </div>

      <div className="space-y-3">
        {links.map((link, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <GripVertical className="w-4 h-4 text-muted mt-2 shrink-0" />
            <div className="flex-1 grid grid-cols-12 gap-3">
              <input
                value={link.label}
                onChange={(e) => updateLink(i, "label", e.target.value)}
                placeholder="ラベル（例: サービス資料）"
                className="col-span-3 px-3 py-2 text-[12.5px] border border-border rounded-md focus:outline-none focus:border-ink"
              />
              <input
                value={link.url}
                onChange={(e) => updateLink(i, "url", e.target.value)}
                placeholder="https://..."
                className="col-span-4 px-3 py-2 text-[12.5px] font-mono border border-border rounded-md focus:outline-none focus:border-ink"
              />
              <select
                value={link.type}
                onChange={(e) => updateLink(i, "type", e.target.value)}
                className="col-span-2 px-2 py-2 text-[12.5px] border border-border rounded-md focus:outline-none focus:border-ink"
              >
                {Object.entries(TYPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select
                value={link.insert_mode}
                onChange={(e) => updateLink(i, "insert_mode", e.target.value)}
                className="col-span-2 px-2 py-2 text-[12.5px] border border-border rounded-md focus:outline-none focus:border-ink"
              >
                <option value="always">常に挿入</option>
                <option value="optional">任意挿入</option>
              </select>
              <input
                value={link.context_hint || ""}
                onChange={(e) => updateLink(i, "context_hint", e.target.value)}
                placeholder="文脈ヒント（任意・AIへの指示）"
                className="col-span-12 px-3 py-2 text-[12px] border border-border rounded-md focus:outline-none focus:border-ink"
              />
            </div>
            <button
              onClick={() => removeLink(i)}
              className="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-md shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {links.length === 0 && (
          <div className="bg-gray-50 border border-dashed border-border rounded-xl p-8 text-center">
            <Link2 className="w-6 h-6 mx-auto text-muted mb-2" />
            <div className="text-[12.5px] text-muted">まだリンクが登録されていません</div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={addLink}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-en font-medium text-ink-2 bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          <Plus className="w-3.5 h-3.5" />
          リンクを追加
        </button>

        <div className="flex items-center gap-4">
          <div className={cn("text-[12.5px]", message?.startsWith("エラー") || message === "ラベルとURLは必須です" ? "text-red-600" : "text-ink-2")}>
            {message}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-en font-medium bg-ink text-accent hover:bg-gray-900 rounded-md disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "保存中..." : "リンクを保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
