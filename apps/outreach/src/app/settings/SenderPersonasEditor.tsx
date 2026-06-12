"use client";

import { useState, useTransition, useEffect } from "react";
import { Save, Mail, Plus, Trash2, X } from "lucide-react";
import { updateSenderPersona, createSenderPersona, deleteSenderPersona } from "./actions";
import { refreshSenderPersonas } from "@/hooks/useSenderPersonas";
import { cn } from "@/lib/utils";

/**
 * 差出人ペルソナのデフォルト署名を生成。
 * 名前とメアドが変わったら自動的に追従する。
 */
function buildDefaultSignature(name: string, email: string): string {
  return `${name || "差出人名"}
株式会社バレンサー
〒530-0001 大阪市北区梅田1-11-4 大阪駅前第4ビル9階
TEL: 06-4400-5365
${email || "info@balencer.jp"}
https://balencer.jp/`;
}

interface Sender {
  id: string;
  display_name: string;
  email_from: string;
  signature_html: string | null;
  consent_at: string;
  active: boolean;
}

export function SenderPersonasEditor({ senders }: { senders: Sender[] }) {
  const [showNew, setShowNew] = useState(false);
  const activeSenders = senders.filter((s) => s.active);
  const inactiveSenders = senders.filter((s) => !s.active);

  return (
    <div className="mt-6 space-y-4">
      {activeSenders.map((s) => (
        <SenderCard key={s.id} sender={s} />
      ))}

      {showNew ? (
        <NewSenderCard onClose={() => setShowNew(false)} />
      ) : (
        <button
          onClick={() => setShowNew(true)}
          className="w-full bg-card border border-dashed border-border rounded-xl p-5 flex items-center justify-center gap-2 text-[12.5px] font-en font-medium text-muted hover:text-ink hover:border-ink-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          差出人ペルソナを新規追加
        </button>
      )}

      {inactiveSenders.length > 0 && (
        <details className="mt-4">
          <summary className="text-[11px] font-en font-medium text-muted cursor-pointer hover:text-ink">
            非アクティブ ({inactiveSenders.length}件)
          </summary>
          <div className="mt-3 space-y-3">
            {inactiveSenders.map((s) => (
              <div
                key={s.id}
                className="bg-gray-50 border border-border rounded-xl p-4 flex items-center justify-between opacity-70"
              >
                <div>
                  <div className="font-medium text-[13px]">{s.display_name}</div>
                  <div className="text-[11px] text-muted font-mono">{s.email_from}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-muted font-mono">
                  非アクティブ
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function NewSenderCard({ onClose }: { onClose: () => void }) {
  const [displayName, setDisplayName] = useState("");
  const [emailFrom, setEmailFrom] = useState("info@balencer.jp");
  const [signature, setSignature] = useState(buildDefaultSignature("", "info@balencer.jp"));
  const [sigDirty, setSigDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 表示名 / メアドが変わったら、ユーザーが手動編集していなければ署名を自動更新
  useEffect(() => {
    if (!sigDirty) setSignature(buildDefaultSignature(displayName, emailFrom));
  }, [displayName, emailFrom, sigDirty]);

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      const res = await createSenderPersona({
        display_name: displayName,
        email_from: emailFrom,
        signature_html: signature,
      });
      if (res.ok) {
        await refreshSenderPersonas();
        onClose();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="bg-card border border-ink rounded-xl p-5">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="text-[10px] uppercase tracking-[.14em] font-en font-medium text-muted">
          新規ペルソナ追加
        </div>
        <button onClick={onClose} className="text-muted hover:text-ink">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Field label="表示名 *">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="例: 田中 真理"
            className="w-full px-3 py-2 text-[13px] border border-border rounded-md focus:outline-none focus:border-ink"
            autoFocus
          />
        </Field>
        <Field label="送信元アドレス *">
          <input
            value={emailFrom}
            onChange={(e) => setEmailFrom(e.target.value)}
            placeholder="info@balencer.jp"
            className="w-full px-3 py-2 text-[13px] font-mono border border-border rounded-md focus:outline-none focus:border-ink"
          />
        </Field>
        <div className="md:col-span-2">
          <Field
            label="署名（メール末尾に挿入）"
            hint="改行・URL・電話番号などを含めて自由記述。AIが本文末尾にこの内容を付与します。"
          >
            <textarea
              value={signature}
              onChange={(e) => {
                setSignature(e.target.value);
                setSigDirty(true);
              }}
              rows={7}
              className="w-full px-3 py-2 text-[12.5px] font-mono leading-relaxed border border-border rounded-md focus:outline-none focus:border-ink resize-y"
            />
          </Field>
        </div>
      </div>

      {error && <div className="text-[12px] text-red-600 mt-3">{error}</div>}

      <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
        <div className="text-[10.5px] text-muted">
          作成すると本人同意ログ（consent_at）が今の時刻で記録されます
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 text-[12.5px] font-en font-medium text-muted hover:text-ink"
          >
            キャンセル
          </button>
          <button
            onClick={handleCreate}
            disabled={pending || !displayName.trim() || !emailFrom.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-en font-medium bg-ink text-accent hover:bg-gray-900 rounded-md disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            {pending ? "作成中..." : "ペルソナを追加"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SenderCard({ sender }: { sender: Sender }) {
  const [displayName, setDisplayName] = useState(sender.display_name);
  const [emailFrom, setEmailFrom] = useState(sender.email_from);
  const [signature, setSignature] = useState(
    sender.signature_html || buildDefaultSignature(sender.display_name, sender.email_from)
  );
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await updateSenderPersona(sender.id, {
        display_name: displayName,
        email_from: emailFrom,
        signature_html: signature,
      });
      setMessage(res.ok ? "保存しました" : `エラー: ${res.error}`);
    });
  };

  const handleDelete = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await deleteSenderPersona(sender.id);
      if (!res.ok) setMessage(`エラー: ${res.error}`);
      else if (res.archived)
        setMessage("過去のキャンペーンで使用中のため非アクティブにしました");
      else setMessage("削除しました");
      await refreshSenderPersonas();
      setConfirmDelete(false);
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <div className="w-10 h-10 rounded-full bg-ink text-accent flex items-center justify-center font-en font-medium">
          {sender.display_name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="font-medium text-[15px]">{sender.display_name}</div>
          <div className="text-[11px] text-muted mt-0.5 font-mono">
            <Mail className="w-3 h-3 inline mr-1" />
            {sender.email_from}
          </div>
        </div>
        <div className="text-[10.5px] text-muted">
          本人同意ログ: {new Date(sender.consent_at).toLocaleDateString("ja-JP")}
        </div>
        <button
          onClick={() => setConfirmDelete(!confirmDelete)}
          className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded"
          title="削除"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {confirmDelete && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3 flex items-center justify-between gap-3">
          <div className="text-[11.5px] text-red-700">
            このペルソナを削除しますか？過去のキャンペーンで使用されていた場合は非アクティブ化されます。
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-[11px] text-muted hover:text-ink"
            >
              キャンセル
            </button>
            <button
              onClick={handleDelete}
              disabled={pending}
              className="px-2.5 py-1 text-[11px] font-en font-medium bg-red-600 text-white rounded hover:bg-red-700"
            >
              削除する
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Field label="表示名">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 text-[13px] border border-border rounded-md focus:outline-none focus:border-ink"
          />
        </Field>
        <Field label="送信元アドレス">
          <input
            value={emailFrom}
            onChange={(e) => setEmailFrom(e.target.value)}
            className="w-full px-3 py-2 text-[13px] font-mono border border-border rounded-md focus:outline-none focus:border-ink"
          />
        </Field>
        <div className="md:col-span-2">
          <Field
            label="署名（メール末尾に挿入）"
            hint="改行・URL・電話番号などを含めて自由記述。AIが本文末尾にこの内容を付与します。"
          >
            <textarea
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              rows={7}
              className="w-full px-3 py-2 text-[12.5px] font-mono leading-relaxed border border-border rounded-md focus:outline-none focus:border-ink resize-y"
            />
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-4">
        <div className={cn("text-[12px]", message?.startsWith("エラー") ? "text-red-600" : "text-emerald-700")}>
          {message}
        </div>
        <button
          onClick={handleSave}
          disabled={pending}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-en font-medium bg-ink text-accent hover:bg-gray-900 rounded-md"
        >
          <Save className="w-3.5 h-3.5" />
          {pending ? "保存中..." : "保存"}
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
