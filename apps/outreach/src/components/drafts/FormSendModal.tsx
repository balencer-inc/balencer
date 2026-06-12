"use client";

import { useState, useEffect, useRef } from "react";
import { X, ExternalLink, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormField {
  name: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  value?: string;
  options?: { value: string; label: string }[];
}

interface AnalyzeResult {
  ok: boolean;
  action?: string;
  method?: string;
  enctype?: string;
  fields?: FormField[];
  sourceUrl?: string;
  error?: string;
  debug?: { htmlLength?: number; htmlSample?: string };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onMarkSent: () => void;
  formUrl: string;
  prefill: {
    company_name: string;
    sender_name: string;
    sender_email: string;
    sender_phone: string;
    subject: string;
    body_plain: string;
  };
  recipientCompany: string;
}

/**
 * 対象企業HPのフォームを解析→モーダル内で自動入力→クリックで実送信
 *
 * 動作:
 * 1. /api/form-analyze にPOSTしてフォーム構造を取得
 * 2. 各フィールドに prefill から類推して自動入力
 * 3. 「この内容で送信」→ 非表示<form>を作成しactionURLに直接POST、target=_blankで結果を別タブ表示
 * 4. ユーザーが結果を確認して「送信済みにマーク」
 */
export function FormSendModal({
  open,
  onClose,
  onMarkSent,
  formUrl,
  prefill,
  recipientCompany,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open || !formUrl) return;
    setLoading(true);
    setAnalysis(null);
    setSubmitted(false);
    fetch("/api/form-analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: formUrl }),
    })
      .then((r) => r.json())
      .then((data: AnalyzeResult) => {
        setAnalysis(data);
        if (data.ok && data.fields) {
          setFieldValues(autoMap(data.fields, prefill));
        }
      })
      .catch((e) => setAnalysis({ ok: false, error: String(e) }))
      .finally(() => setLoading(false));
  }, [open, formUrl]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!analysis?.ok || !analysis.action) return;
    if (!confirm(`${recipientCompany}様のフォームへ送信します。よろしいですか？`)) return;
    setSubmitting(true);
    setTimeout(() => {
      formRef.current?.submit();
      setSubmitting(false);
      setSubmitted(true);
    }, 100);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[760px] my-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダ */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-ink text-accent flex items-center justify-center text-[12px] font-medium">
              📋
            </div>
            <div className="min-w-0">
              <h2 className="font-en text-[16px] font-medium truncate">
                {recipientCompany} のフォームに送信
              </h2>
              <div className="text-[10.5px] text-muted font-mono truncate">{formUrl}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-muted hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 本文 */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-amber-600 mb-3" />
              <div className="text-[13px] text-ink-2">HPのフォーム構造を解析中...</div>
            </div>
          )}

          {!loading && analysis && !analysis.ok && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-[13px] font-medium text-red-700">
                <AlertCircle className="w-4 h-4" />
                フォーム解析に失敗しました
              </div>
              <div className="text-[11.5px] text-red-700/80 leading-relaxed">{analysis.error}</div>

              {analysis.debug?.htmlSample && (
                <details className="text-[10.5px] text-red-700/70 mt-2">
                  <summary className="cursor-pointer">取得したHTML先頭（デバッグ用）</summary>
                  <pre className="mt-1 p-2 bg-red-100/50 rounded font-mono text-[10px] whitespace-pre-wrap break-all">
                    取得サイズ: {analysis.debug.htmlLength}文字{"\n"}
                    {analysis.debug.htmlSample}
                  </pre>
                </details>
              )}

              <div className="text-[11.5px] text-ink-2 pt-2 border-t border-red-200 leading-relaxed">
                <strong>考えられる原因:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>このURLは <strong>お問い合わせフォームのページではなく</strong>、別のURL（例: /contact）にフォームがある</li>
                  <li>JSで動的生成（React/Vue製の SPA フォーム）— 静的解析では取れない</li>
                  <li>サイトが Bot を遮断（Cloudflare/WAF/reCAPTCHA）</li>
                </ul>
                <div className="mt-2"><strong>対処:</strong> 候補レビュー画面で contact_value を <strong>正しいフォームページのURL</strong> に編集するか、下のボタンで別タブから手動送信してください。</div>
              </div>
              <div className="flex gap-2 pt-2">
                <a
                  href={formUrl}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-en font-medium bg-ink text-accent hover:bg-gray-900 rounded-md"
                >
                  <ExternalLink className="w-3 h-3" /> 別タブで開いて手動送信
                </a>
              </div>
            </div>
          )}

          {!loading && analysis?.ok && submitted && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2 text-[14px] font-medium text-emerald-800">
                <CheckCircle className="w-5 h-5" />
                送信処理しました
              </div>
              <div className="text-[12px] text-emerald-900/80 leading-relaxed">
                別タブが開き、対象サイトに送信されました。新しく開いたタブで「送信完了」「ありがとうございました」等の表示を確認してください。
                <br />
                確認できたら下の「送信済みにマーク」を押すと進捗に反映されます。
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-[11.5px] text-amber-900 leading-relaxed">
                <div className="font-medium mb-1">⚠ 「spam_failed」「不正な操作」エラーが出た場合</div>
                対象サイトの CSRF/reCAPTCHA 保護が原因です。下の <b>「もう一度送信する」</b> を押すと、対象ページを開き直して再入力できます。改善しない場合は「送信処理しました」のメッセージは無視して、対象サイトのフォームを直接開いて手動で送信してください（コピペ用のフィールドは下に残っています）。
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    onMarkSent();
                    // 即視覚反映してからモーダル閉じる
                    setTimeout(() => onClose(), 300);
                  }}
                  className="px-5 py-2.5 text-[13px] font-en font-medium bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.97] rounded-md transition-all inline-flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  ✓ 送信済みにマーク
                </button>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-3 py-2 text-[11.5px] text-muted hover:text-ink"
                >
                  もう一度送信する
                </button>
              </div>
            </div>
          )}

          {!loading && analysis?.ok && !submitted && analysis.fields && (
            <>
              <div className="text-[11px] text-ink-2 mb-4 bg-amber-50 border border-amber-200 rounded p-2.5 leading-relaxed">
                💡 自動でマッチした項目を表示しています。内容を確認・修正してから「送信」を押してください。送信ボタンを押すと別タブが開き、対象サイトに直接POSTされます。
              </div>
              <div className="space-y-3">
                {analysis.fields.map((f) => {
                  if (["hidden", "submit", "button", "image", "reset"].includes(f.type)) {
                    return null;
                  }
                  return (
                    <div key={f.name}>
                      <label className="block text-[11px] font-medium text-ink-2 mb-1">
                        {f.label}
                        {f.required && <span className="text-red-500 ml-1">*</span>}
                        <span className="text-muted font-mono font-normal ml-2">({f.name})</span>
                      </label>
                      <FieldInput
                        field={f}
                        value={fieldValues[f.name] || ""}
                        onChange={(v) => setFieldValues({ ...fieldValues, [f.name]: v })}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* フッタ */}
        {!loading && analysis?.ok && !submitted && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3 bg-gray-50 rounded-b-2xl">
            <div className="text-[10.5px] text-muted">
              送信先: <code className="font-mono">{analysis.action}</code>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-3 py-2 text-[12px] font-en font-medium text-muted hover:text-ink"
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-[12.5px] font-en font-medium bg-ink text-accent hover:bg-gray-900 rounded-md disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                この内容で送信
              </button>
            </div>
          </div>
        )}

        {/* 実際にPOSTする隠しフォーム（別タブで結果表示） */}
        {analysis?.ok && analysis.action && (
          <form
            ref={formRef}
            action={analysis.action}
            method={analysis.method?.toLowerCase() === "get" ? "get" : "post"}
            encType={analysis.enctype || "application/x-www-form-urlencoded"}
            target="_blank"
            rel="noopener"
            style={{ display: "none" }}
          >
            {Object.entries(fieldValues).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          </form>
        )}
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.type === "textarea") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder={field.placeholder}
        className="w-full px-3 py-2 text-[12.5px] border border-border rounded-md focus:outline-none focus:border-ink leading-relaxed"
      />
    );
  }
  if (field.type === "select" && field.options) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-[12.5px] border border-border rounded-md focus:outline-none focus:border-ink"
      >
        <option value="">（選択してください）</option>
        {field.options.map((o, i) => (
          <option key={i} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      className="w-full px-3 py-2 text-[12.5px] border border-border rounded-md focus:outline-none focus:border-ink"
    />
  );
}

/**
 * フォームフィールドにヒューリスティックで自動マッピング
 */
function autoMap(fields: FormField[], prefill: Props["prefill"]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const f of fields) {
    if (["hidden", "submit", "button", "image", "reset"].includes(f.type)) {
      if (f.value) result[f.name] = f.value;
      continue;
    }
    const hint = `${f.name} ${f.label} ${f.placeholder || ""}`.toLowerCase();
    const v = matchField(hint, prefill);
    if (v !== null) result[f.name] = v;
    else if (f.value) result[f.name] = f.value;
  }
  return result;
}

function matchField(hint: string, p: Props["prefill"]): string | null {
  const includesAny = (keys: string[]) => keys.some((k) => hint.includes(k));

  if (includesAny(["会社名", "社名", "company", "貴社", "法人", "organization"])) return p.company_name;
  if (includesAny(["メール", "email", "e-mail", "mail"])) return p.sender_email;
  if (includesAny(["電話", "tel", "phone", "連絡先"])) return p.sender_phone;
  if (includesAny(["件名", "タイトル", "subject", "title", "題名"])) return p.subject;
  if (
    includesAny([
      "内容",
      "本文",
      "message",
      "comment",
      "inquiry",
      "詳細",
      "ご相談",
      "ご要望",
      "メッセージ",
      "お問い合わせ",
    ])
  )
    return p.body_plain;
  if (includesAny(["お名前", "氏名", "name", "ご担当者", "フルネーム", "姓名"])) return p.sender_name;

  return null;
}
