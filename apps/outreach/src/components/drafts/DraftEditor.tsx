"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Sparkles,
  CheckCircle,
  ExternalLink,
  Copy,
  Check,
  Mail,
  FileText,
  AlertCircle,
  RefreshCw,
  Trash2,
  Send as SendIcon,
  Keyboard,
} from "lucide-react";
import {
  updateDraft,
  regenerateDraft,
  approveDraft,
  sendDraft,
  markFormSent,
  deleteDraft,
} from "@/app/drafts/actions";
import { cn } from "@/lib/utils";

interface Props {
  draft: any;
}

export function DraftEditor({ draft }: Props) {
  const router = useRouter();
  const isForm = draft.prospects?.contact_method === "form";
  const formFields = draft.prospects?.analysis?.form_fields || {};
  const hookEvidence = draft.hook_evidence || {};

  const [subject, setSubject] = useState<string>(draft.subject || "");
  const [bodyMd, setBodyMd] = useState<string>(draft.body_md || "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // 再生成等で draft が更新されたら state も同期
  useEffect(() => {
    setSubject(draft.subject || "");
    setBodyMd(draft.body_md || "");
  }, [draft.id, draft.generated_at]);

  const isDirty = subject !== draft.subject || bodyMd !== draft.body_md;

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await updateDraft(draft.id, { subject, body_md: bodyMd });
      setMessage(res.ok ? "保存しました" : `エラー: ${res.error}`);
      if (res.ok) router.refresh();
    });
  };

  const [scheduledAt, setScheduledAt] = useState<string>("");

  // 次の未送信下書きを探して遷移するヘルパー
  const goToNextDraft = () => {
    const allRows = Array.from(document.querySelectorAll<HTMLLIElement>("[data-draft-row]"));
    const currentIdx = allRows.findIndex((r) => r.dataset.draftRow === draft.id);
    // 現在より下、かつ status が sent じゃないものを探す
    const next = allRows.slice(currentIdx + 1).find((r) => r.dataset.draftStatus !== "sent");
    if (next) {
      const id = next.dataset.draftRow;
      router.push(`/drafts?selected=${id}`, { scroll: false });
      return true;
    }
    return false;
  };

  const handleSend = (autoNext = false) => {
    setMessage(scheduledAt ? `Resendで送信予約中（${scheduledAt}）...` : "Resend経由で送信中...");
    startTransition(async () => {
      if (isDirty) {
        await updateDraft(draft.id, { subject, body_md: bodyMd });
      }
      // 未承認の場合は自動で承認してから送信
      if (draft.status !== "approved" && draft.status !== "sent") {
        await approveDraft(draft.id);
      }
      const iso = scheduledAt ? new Date(scheduledAt).toISOString() : undefined;
      const res = await sendDraft(draft.id, iso);
      if (res.ok) {
        setMessage(
          iso
            ? `✓ ${new Date(iso).toLocaleString("ja-JP")} に送信予約しました`
            : `✓ 送信しました (Resend ID: ${res.resendId?.slice(0, 8)}...)`
        );
        router.refresh();
        if (autoNext) {
          setTimeout(() => goToNextDraft(), 300);
        }
      } else {
        setMessage(`エラー: ${res.error}`);
      }
    });
  };

  // キーボードショートカット（handleSend/handleSave の後で登録）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (isDirty && !pending) handleSave();
      } else if (key === "s" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (!pending && draft.status !== "sent") handleSend(true);
      } else if (key === "n") {
        e.preventDefault();
        goToNextDraft();
      } else if (key === "p") {
        e.preventDefault();
        const allRows = Array.from(document.querySelectorAll<HTMLLIElement>("[data-draft-row]"));
        const currentIdx = allRows.findIndex((r) => r.dataset.draftRow === draft.id);
        const prev = allRows.slice(0, currentIdx).reverse().find((r) => r.dataset.draftStatus !== "sent");
        if (prev) {
          const id = prev.dataset.draftRow;
          router.push(`/drafts?selected=${id}`, { scroll: false });
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.id, draft.status, isDirty, pending]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    draft.selected_template_id || ""
  );

  const [regenerating, setRegenerating] = useState(false);
  const handleRegen = () => {
    if (!confirm("最新のサービス情報・署名・権威性データで下書きを再生成します。現在の編集内容は失われます。よろしいですか？")) {
      return;
    }
    setRegenerating(true);
    setMessage(null);
    startTransition(async () => {
      const res = await regenerateDraft(draft.prospect_id, selectedTemplateId || undefined);
      if (res.ok) {
        setMessage("✓ 再生成しました（最新データで作り直し済み）");
        router.refresh();
      } else {
        setMessage(`エラー: ${res.error}`);
      }
      setRegenerating(false);
    });
  };

  const handleDelete = () => {
    if (!confirm("この下書きを削除します。候補企業は「採用済み」状態に戻り、後で再度下書き生成が可能です。よろしいですか？")) {
      return;
    }
    startTransition(async () => {
      const res = await deleteDraft(draft.id, draft.prospect_id);
      if (res.ok) {
        setMessage("✓ 削除しました");
        router.push("/drafts");
      } else {
        setMessage(`エラー: ${res.error}`);
      }
    });
  };

  const handleMarkFormSent = () => {
    startTransition(async () => {
      const res = await markFormSent(draft.prospect_id);
      setMessage(res.ok ? "✓ 送信済みにマークしました（下書き一覧から消えます）" : `エラー: ${res.error}`);
      if (res.ok) {
        // 下書き一覧から消えるので、選択を解除して /drafts に戻る
        router.push("/drafts");
        router.refresh();
      }
    });
  };

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
      {/* 再生成中オーバーレイ */}
      {regenerating && (
        <div className="absolute inset-0 z-50 bg-white/85 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4" />
            <div className="font-en text-[18px] font-medium text-ink">AIが再生成中</div>
            <div className="mt-1 text-[12.5px] text-muted">最新のサービス情報・署名・権威性データを取得して作り直しています。30〜60秒お待ちください...</div>
          </div>
        </div>
      )}

      {/* 左 2/3: メール本文編集 */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="bg-gray-50 border-b border-border px-5 py-3">
            <label className="block text-[10px] uppercase tracking-[.14em] font-en font-medium text-muted mb-1.5">
              件名 (編集可能)
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="件名を入力..."
              className="w-full text-[15px] font-medium bg-white border border-border rounded-md px-3 py-2 focus:outline-none focus:border-ink hover:border-ink-2 transition-colors"
            />
          </div>

          <div className="px-5 py-4 border-b border-border">
            <label className="block text-[10px] uppercase tracking-[.14em] font-en font-medium text-muted mb-1.5">
              本文 Markdown (編集可能)
            </label>
            <textarea
              value={bodyMd}
              onChange={(e) => setBodyMd(e.target.value)}
              rows={20}
              placeholder="本文を入力..."
              className="w-full text-[13px] leading-relaxed font-mono bg-white border border-border rounded-md px-3 py-2 focus:outline-none focus:border-ink hover:border-ink-2 transition-colors resize-y"
            />
          </div>

          <div className="px-5 py-3 bg-gray-50 flex items-center justify-between text-[11px] text-muted gap-3">
            <span>{bodyMd.length} 文字</span>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                onClick={handleDelete}
                disabled={pending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-en font-medium text-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="下書きを削除して、後で作り直せる状態に戻す"
              >
                <Trash2 className="w-3 h-3" />
                削除
              </button>
              {/* テンプレ選択 dropdown — 採用テンプレが2件以上ある時のみ */}
              {draft.services?.active_template_ids?.length > 1 && (
                <TemplateDropdown
                  serviceId={draft.service_id}
                  value={selectedTemplateId}
                  onChange={setSelectedTemplateId}
                />
              )}
              <button
                onClick={handleRegen}
                disabled={pending || regenerating}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-en font-medium rounded-md transition-colors",
                  regenerating
                    ? "bg-amber-100 text-amber-900 cursor-wait"
                    : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                )}
                title="最新のサービス情報・署名・権威性データで再生成"
              >
                <RefreshCw className={cn("w-3 h-3", regenerating && "animate-spin")} />
                {regenerating ? "AI再生成中..." : "最新情報で再生成"}
              </button>
              <button
                onClick={handleSave}
                disabled={pending}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-en font-medium rounded-md",
                  isDirty
                    ? "bg-amber-100 text-amber-900 hover:bg-amber-200 ring-2 ring-amber-300 ring-offset-1"
                    : "bg-gray-100 text-ink hover:bg-gray-200",
                  pending && "opacity-50 cursor-wait"
                )}
                title={isDirty ? "変更を保存（未保存あり）" : "保存（変更なし）"}
              >
                <Save className="w-3 h-3" />
                {isDirty ? "編集を保存 (未保存)" : "編集を保存"}
              </button>
            </div>
          </div>
        </div>

        {/* フック根拠 */}
        {hookEvidence.quote_text && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-[.14em] font-en font-medium text-yellow-700 mb-1.5 flex items-center gap-1">
              ★ フック根拠（hook_evidence）
            </div>
            <div className="text-[13px] text-ink italic leading-relaxed">"{hookEvidence.quote_text}"</div>
            <div className="mt-2 text-[10.5px] text-yellow-700/80 font-mono">
              出典:{" "}
              <a href={hookEvidence.quote_url} target="_blank" rel="noopener" className="underline">
                {hookEvidence.quote_url}
              </a>
            </div>
          </div>
        )}

        {/* メッセージ */}
        {message && (
          <div
            className={cn(
              "text-[12.5px] flex items-start gap-1.5",
              message.startsWith("エラー") ? "text-red-600" : "text-emerald-700"
            )}
          >
            {message.startsWith("エラー") ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* 右 1/3: 送信モード別パネル */}
      <div className="space-y-4">
        {isForm ? (
          <FormSendPanel
            draft={draft}
            formFields={formFields}
            subject={subject}
            bodyMd={bodyMd}
            onMarkSent={handleMarkFormSent}
            pending={pending}
          />
        ) : (
          <EmailSendPanel
            draft={draft}
            onSend={handleSend}
            pending={pending}
            scheduledAt={scheduledAt}
            setScheduledAt={setScheduledAt}
          />
        )}
      </div>
    </div>
  );
}

function EmailSendPanel({
  draft,
  onSend,
  pending,
  scheduledAt,
  setScheduledAt,
}: {
  draft: any;
  onSend: (autoNext?: boolean) => void;
  pending: boolean;
  scheduledAt: string;
  setScheduledAt: (v: string) => void;
}) {
  const isSent = draft.status === "sent";

  // プリセット時刻
  const presetTimes = (): Array<{ label: string; getDate: () => Date }> => {
    return [
      { label: "30分後", getDate: () => new Date(Date.now() + 30 * 60_000) },
      { label: "1時間後", getDate: () => new Date(Date.now() + 60 * 60_000) },
      { label: "明日 10:00", getDate: () => tomorrow10am(new Date()) },
      { label: "明日 14:00", getDate: () => tomorrow2pm(new Date()) },
    ];
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4 sticky top-6">
      <div>
        <div className="text-[10px] uppercase tracking-[.14em] font-en font-medium text-muted mb-1">
          送信モード
        </div>
        <div className="flex items-center gap-1.5 font-en text-[14px] font-medium">
          <Mail className="w-4 h-4" /> Email via Resend
        </div>
      </div>

      {!isSent && (
        <div className="border border-border rounded-md p-3 space-y-2 bg-gray-50">
          <div className="text-[10px] uppercase tracking-[.14em] font-en font-medium text-muted">送信タイミング</div>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full px-2 py-1.5 text-[12px] border border-border rounded bg-white focus:outline-none focus:border-ink"
          />
          <div className="flex flex-wrap gap-1">
            {presetTimes().map((p) => (
              <button
                key={p.label}
                onClick={() => setScheduledAt(toLocalDatetimeInput(p.getDate()))}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-border hover:bg-gray-100"
              >
                {p.label}
              </button>
            ))}
            {scheduledAt && (
              <button
                onClick={() => setScheduledAt("")}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-border hover:bg-gray-100 text-muted"
              >
                即時送信に戻す
              </button>
            )}
          </div>
          <div className="text-[10px] text-muted">
            {scheduledAt ? `予約時刻: ${new Date(scheduledAt).toLocaleString("ja-JP")}` : "空欄なら即時送信"}
          </div>
        </div>
      )}

      <div className="text-[11.5px] text-ink-2 leading-relaxed">
        宛先 <span className="font-mono">{draft.prospects?.contact_value}</span> に
        Resend 経由で配信します。特電法フッタと配信停止リンクは自動付与されます。
      </div>

      {isSent ? (
        <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded text-[11.5px] flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" /> 送信済み
        </div>
      ) : (
        <>
          {/* 主役: 送信1ボタン（承認は内部で自動） */}
          <button
            onClick={() => onSend(true)}
            disabled={pending}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-[14px] font-en font-medium bg-ink text-accent hover:bg-gray-900 rounded-md disabled:opacity-50 transition-all"
          >
            <SendIcon className="w-4 h-4" />
            {pending ? "送信中..." : scheduledAt ? "予約して次へ" : "送信して次へ"}
          </button>
          <div className="text-[10.5px] text-muted text-center">
            <Keyboard className="w-3 h-3 inline mr-1" />
            <kbd className="px-1 py-0.5 bg-gray-100 border border-border rounded font-mono text-[10px]">S</kbd>
            送信
            <kbd className="px-1 py-0.5 bg-gray-100 border border-border rounded font-mono text-[10px]">N</kbd>
            次
            <kbd className="px-1 py-0.5 bg-gray-100 border border-border rounded font-mono text-[10px]">P</kbd>
            前
            <kbd className="px-1 py-0.5 bg-gray-100 border border-border rounded font-mono text-[10px]">⌘S</kbd>
            保存
          </div>
        </>
      )}
    </div>
  );
}

/**
 * フォーム送信パネル（再設計）
 *
 * 旧: フォーム解析モーダル中心 → 多くのサイトで失敗（CSRF/JS/reCAPTCHA）
 * 新: 「対象フォームを別タブで開く + コピペ補助 + 送信済みマーク」を主役に。
 *     ブックマークレット（自動入力）はオプションとして折りたたみ。
 */
function FormSendPanel({
  draft,
  formFields,
  subject,
  bodyMd,
  onMarkSent,
  pending,
}: {
  draft: any;
  formFields: any;
  subject: string;
  bodyMd: string;
  onMarkSent: () => void;
  pending: boolean;
}) {
  const formUrl = draft.prospects?.contact_value;
  const companyName = draft.prospects?.company_name || "対象企業";
  const prefill = {
    company_name: formFields.company_name || draft.organizations?.name || "株式会社バレンサー",
    sender_name: formFields.sender_name || draft.sender_personas?.display_name || "",
    sender_email: formFields.sender_email || draft.sender_personas?.email_from || "",
    sender_phone: formFields.sender_phone || "06-4400-5365",
    subject,
    body_plain: stripMarkdown(bodyMd),
  };
  const fields = [
    { label: "会社名", value: prefill.company_name },
    { label: "お名前", value: prefill.sender_name },
    { label: "メール", value: prefill.sender_email },
    { label: "電話", value: prefill.sender_phone },
    { label: "件名", value: prefill.subject },
    { label: "本文", value: prefill.body_plain, multiline: true },
  ];

  const bookmarkletUrl = buildAutoFillBookmarklet({
    company: prefill.company_name,
    name: prefill.sender_name,
    email: prefill.sender_email,
    phone: prefill.sender_phone,
    subject: prefill.subject,
    body: prefill.body_plain,
  });

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-[.14em] font-en font-medium text-amber-700 mb-1">
          送信モード
        </div>
        <div className="flex items-center gap-1.5 font-en text-[14px] font-medium">
          <FileText className="w-4 h-4" /> フォーム送信
        </div>
        <div className="mt-1 text-[10.5px] text-muted">
          対象: <span className="font-mono break-all">{formUrl}</span>
        </div>
      </div>

      {/* 主役1: Chrome 拡張で自動入力（拡張インストール時）or 主役2: 対象フォームを別タブで開く */}
      {formUrl && (
        <ChromeExtensionFillButton
          targetUrl={formUrl}
          fields={prefill}
          fallbackUrl={formUrl}
        />
      )}

      {/* コピペ補助フィールド（常時展開） */}
      <div className="border border-border rounded-md p-3 bg-gray-50 space-y-1.5">
        <div className="text-[10px] uppercase tracking-[.14em] font-en font-medium text-muted mb-1">
          コピペ用フィールド
        </div>
        {fields.map((f) => (
          <FieldCopyRow key={f.label} label={f.label} value={f.value} />
        ))}
        <CopyAllButton fields={fields} />
      </div>

      {/* オプション: ブックマークレット（上級者向け） */}
      <details className="border border-border rounded-md">
        <summary className="px-3 py-2 text-[11.5px] cursor-pointer hover:bg-gray-50 select-none">
          🔖 ブックマークレットで自動入力（上級者向け）
        </summary>
        <div className="px-3 pb-3 space-y-2 text-[11px]">
          <div className="text-muted leading-relaxed">
            ブラウザのブックマークバーに以下のリンクを <b>ドラッグ&ドロップ</b>して保存しておくと、
            対象フォームのページで1クリックで自動入力されます。
          </div>
          <a
            href={bookmarkletUrl}
            onClick={(e) => {
              e.preventDefault();
              alert("このリンクをブックマークバーに**ドラッグ&ドロップ**してください（クリックでは保存できません）");
            }}
            className="inline-block px-3 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 rounded font-en font-medium hover:bg-amber-200"
            draggable
          >
            🔖 {companyName} 自動入力
          </a>
          <div className="text-[10px] text-muted/80 leading-relaxed">
            初回のみ設定: 上のリンクをドラッグ → 対象フォームページで保存したブックマークをクリック → 自動入力 → 内容確認 → 送信ボタンを押す
          </div>
        </div>
      </details>

      {/* 主役: 送信済みマーク */}
      <FormSentMarker
        draft={draft}
        onMarkSent={onMarkSent}
        pending={pending}
      />
    </div>
  );
}

/**
 * Chrome拡張で自動入力するボタン。
 * - 拡張がインストール済みなら主役ボタン（黒×イエロー、自動入力）
 * - 未インストールなら従来の「対象フォームを別タブで開く」ボタンにフォールバック
 *   + 拡張インストールの案内
 *
 * 拡張の検出: outreach-bridge.js が読み込まれると window に
 * BALENCER_EXTENSION_READY postMessage を投げる。それを受信したら installed=true
 */
function ChromeExtensionFillButton({
  targetUrl,
  fields,
  fallbackUrl,
}: {
  targetUrl: string;
  fields: Record<string, string>;
  fallbackUrl: string;
}) {
  const [installed, setInstalled] = useState(false);
  const [status, setStatus] = useState<null | { kind: "ok" | "err"; msg: string }>(null);

  useEffect(() => {
    // 注: bridge.js は ISOLATED world で動くため window グローバルフラグは MAIN world からは見えない。
    // 拡張機能との通信は postMessage に統一する(MAIN/ISOLATED 両方で動く)。

    let installedRef = false; // 1度検出したら以降のpingは止める

    // (1) postMessage で READY 受信を待つ
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window) return;
      const data = event.data;
      if (!data) return;
      if (data.type === "BALENCER_EXTENSION_READY") {
        installedRef = true;
        setInstalled(true);
      }
      if (data.type === "BALENCER_FORM_FILL_ACK") {
        if (data.ok) {
          setStatus({ kind: "ok", msg: "新タブが開いて自動入力中です。内容を確認して送信ボタンを押してください。" });
        } else {
          setStatus({ kind: "err", msg: `拡張からのエラー: ${data.error || "unknown"}` });
        }
      }
    };
    window.addEventListener("message", onMessage);

    // (2) こちらから PING を投げて拡張機能に応答を促す(タイミングが逆転した場合の対策)
    //     - bridge.js が PING を受けたら即 READY を返す
    //     - 200ms間隔で 5秒間 試す (拡張機能注入の遅延に対応)
    const pingInterval = setInterval(() => {
      if (installedRef) {
        clearInterval(pingInterval);
        return;
      }
      window.postMessage({ type: "BALENCER_EXTENSION_PING" }, "*");
    }, 200);
    const pingTimeout = setTimeout(() => clearInterval(pingInterval), 5000);

    // 即時1回PING
    window.postMessage({ type: "BALENCER_EXTENSION_PING" }, "*");

    return () => {
      window.removeEventListener("message", onMessage);
      clearInterval(pingInterval);
      clearTimeout(pingTimeout);
    };
  }, []);

  const handleExtensionClick = () => {
    setStatus(null);
    window.postMessage(
      {
        type: "BALENCER_FORM_FILL",
        payload: {
          targetUrl,
          sourceUrl: window.location.href,
          fields,
        },
      },
      "*"
    );
  };

  if (installed) {
    return (
      <div className="space-y-2">
        <button
          onClick={handleExtensionClick}
          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 text-[13px] font-en font-medium bg-ink text-accent hover:bg-gray-900 active:scale-[0.98] rounded-md transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Chrome拡張で自動入力（推奨）
        </button>
        <a
          href={fallbackUrl}
          target="_blank"
          rel="noopener"
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[11.5px] text-muted hover:text-ink border border-border rounded-md hover:bg-gray-50"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          手動で別タブで開く（拡張を使わない）
        </a>
        {status && (
          <div
            className={cn(
              "text-[11px] rounded-md px-3 py-2",
              status.kind === "ok"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                : "bg-red-50 border border-red-200 text-red-900"
            )}
          >
            {status.msg}
          </div>
        )}
      </div>
    );
  }

  // 拡張未インストール: 従来のボタン + 案内
  return (
    <div className="space-y-2">
      <a
        href={fallbackUrl}
        target="_blank"
        rel="noopener"
        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 text-[13px] font-en font-medium bg-ink text-accent hover:bg-gray-900 active:scale-[0.98] rounded-md transition-all"
      >
        <ExternalLink className="w-4 h-4" />
        対象フォームを別タブで開く
      </a>
      <div className="text-[10.5px] text-muted bg-amber-50 border border-amber-200 rounded-md px-3 py-2 leading-relaxed">
        💡 <b>BALENCER Outreach Chrome拡張</b> をインストールすると、ワンクリックで自動入力できます。詳細は管理者へ。
      </div>
    </div>
  );
}

/**
 * 自動入力UI: ブックマーク方式 + コンソール貼り付け方式 を並列表示
 */
function AutoFillSection({
  bookmarkletUrl,
  companyName,
}: {
  bookmarkletUrl: string;
  companyName: string;
}) {
  const [tab, setTab] = useState<"bookmark" | "console">("bookmark");
  const [copied, setCopied] = useState(false);

  // bookmarkletUrl から javascript: プレフィックスを取り除いてコンソール用コードに
  const consoleCode = decodeURIComponent(
    bookmarkletUrl.replace(/^javascript:/, "")
  );

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(consoleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10.5px] font-en font-medium text-amber-900 flex items-center gap-1.5">
          🔖 ワンクリック自動入力（推奨）
        </div>
        <div className="flex gap-0.5 text-[10px]">
          <button
            onClick={() => setTab("bookmark")}
            className={cn(
              "px-2 py-0.5 rounded font-en font-medium",
              tab === "bookmark"
                ? "bg-amber-200 text-amber-950"
                : "text-amber-700 hover:bg-amber-100"
            )}
          >
            ブックマーク方式
          </button>
          <button
            onClick={() => setTab("console")}
            className={cn(
              "px-2 py-0.5 rounded font-en font-medium",
              tab === "console"
                ? "bg-amber-200 text-amber-950"
                : "text-amber-700 hover:bg-amber-100"
            )}
          >
            コンソール方式
          </button>
        </div>
      </div>

      {tab === "bookmark" ? (
        <>
          <ol className="text-[11px] text-amber-900/90 leading-relaxed space-y-1 list-decimal list-inside">
            <li>
              ブックマークバーを表示（<code className="font-mono bg-amber-100 px-1 rounded">⌘+Shift+B</code>）
            </li>
            <li>下の黄色いリンクをブックマークバーに<strong>ドラッグ</strong>（1回だけの作業）</li>
            <li>下の「フォームを開く」で別タブを開く</li>
            <li>そのタブで<strong>ブックマークバーの登録分をクリック</strong>→ 全項目自動入力</li>
            <li>内容確認 → サイト側の送信ボタンを押す</li>
          </ol>
          <a
            href={bookmarkletUrl}
            draggable
            onClick={(e) => e.preventDefault()}
            className="block w-full text-center px-3 py-2 text-[12px] font-en font-medium bg-amber-200 text-amber-950 hover:bg-amber-300 rounded-md cursor-grab active:cursor-grabbing border border-amber-400"
            title="このリンクをブラウザ上端のブックマークバーにドラッグ"
          >
            ⬇ {companyName} へ自動入力（ドラッグ）
          </a>
        </>
      ) : (
        <>
          <ol className="text-[11px] text-amber-900/90 leading-relaxed space-y-1 list-decimal list-inside">
            <li>下の「コードをコピー」を押す</li>
            <li>「フォームを開く」で対象サイトを別タブで開く</li>
            <li>
              そのタブで<strong>ブラウザの開発者ツールを開く</strong>（
              <code className="font-mono bg-amber-100 px-1 rounded">⌘+Option+I</code>）
            </li>
            <li>「Console」タブを開いて<strong>貼り付け→Enter</strong>→ 全項目自動入力</li>
            <li>内容確認 → サイト側の送信ボタンを押す</li>
          </ol>
          <button
            onClick={handleCopyCode}
            className={cn(
              "w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-en font-medium rounded-md transition-colors",
              copied
                ? "bg-emerald-200 text-emerald-900"
                : "bg-amber-200 text-amber-950 hover:bg-amber-300"
            )}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "コピーした！" : "コードをコピー"}
          </button>
        </>
      )}
    </div>
  );
}

/**
 * フォーム自動入力ブックマークレットを生成。
 * - フィールドのラベル/name/id/placeholder からヒューリスティックにマッチング
 * - React/Vue 等の制御コンポーネントにも反応するよう input/change イベント発火
 */
function buildAutoFillBookmarklet(data: {
  company: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  body: string;
}) {
  const dataJson = JSON.stringify(data);
  const script = `(function(){var d=${dataJson};function getLbl(el){var id=el.id;if(id){var l=document.querySelector('label[for="'+CSS.escape(id)+'"]');if(l)return l.textContent.toLowerCase();}var p=el.closest('label');if(p)return p.textContent.toLowerCase();var pr=el.closest('tr,div,li,p');if(pr){var t=pr.querySelector('label,th,dt');if(t)return t.textContent.toLowerCase();}return'';}function hint(el){return((el.name||'')+' '+(el.id||'')+' '+(el.placeholder||'')+' '+(el.getAttribute('aria-label')||'')+' '+getLbl(el)).toLowerCase();}function setVal(el,v){var p=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value')||Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value');if(p&&p.set){p.set.call(el,v);}else{el.value=v;}el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}function fill(keys,val){if(!val)return false;var els=document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=checkbox]):not([type=radio]),textarea');for(var i=0;i<els.length;i++){var h=hint(els[i]);for(var j=0;j<keys.length;j++){if(h.indexOf(keys[j])>=0){setVal(els[i],val);return true;}}}return false;}var r=[];r.push('会社名:'+(fill(['会社名','社名','company','貴社名','法人名','organization'],d.company)?'OK':'NG'));r.push('お名前:'+(fill(['お名前','氏名','name','ご担当者','フルネーム','full name','姓名'],d.name)?'OK':'NG'));r.push('メール:'+(fill(['メール','email','e-mail','mail'],d.email)?'OK':'NG'));if(d.phone)r.push('電話:'+(fill(['電話','tel','phone','連絡先'],d.phone)?'OK':'NG'));r.push('件名:'+(fill(['件名','タイトル','subject','title','題名'],d.subject)?'OK':'NG'));r.push('内容:'+(fill(['お問い合わせ内容','内容','本文','message','comment','inquiry','詳細','ご相談','ご要望','メッセージ'],d.body)?'OK':'NG'));alert('自動入力完了\\n\\n'+r.join('\\n')+'\\n\\n内容を確認して送信ボタンを押してください。');})();`;
  return `javascript:${encodeURIComponent(script)}`;
}

/**
 * フォーム送信モードの「送信済みにマーク」ボタン。
 * 楽観的UI（即視覚反映）+ 取り消し可能。
 */
function FormSentMarker({
  draft,
  onMarkSent,
  pending,
}: {
  draft: any;
  onMarkSent: () => void;
  pending: boolean;
}) {
  const router = useRouter();
  const [unmarking, startUnmark] = useTransition();
  // 楽観的に「マーク済み」表示するためのローカル state
  const [optimisticSent, setOptimisticSent] = useState(false);

  const dbSent = draft.status === "sent" || draft.prospects?.pipeline_stage === "sent";
  const isSent = dbSent || optimisticSent;

  const handleClick = () => {
    setOptimisticSent(true);
    onMarkSent();
  };

  const handleUnmark = async () => {
    if (!confirm("「送信済み」のマークを取り消します。よろしいですか？")) return;
    startUnmark(async () => {
      const { unmarkFormSent } = await import("@/app/drafts/actions");
      const res = await unmarkFormSent(draft.prospect_id);
      if (res.ok) {
        setOptimisticSent(false);
        router.refresh();
      } else {
        alert((res as any).error || "取り消しに失敗しました");
      }
    });
  };

  if (isSent) {
    return (
      <div className="w-full bg-emerald-100 border-2 border-emerald-400 rounded-md p-4 text-center space-y-2 transition-all">
        <div className="flex items-center justify-center gap-2 text-emerald-800 font-en font-medium">
          <CheckCircle className="w-5 h-5" />
          <span className="text-[14px]">送信済みにマーク済み</span>
        </div>
        <div className="text-[10.5px] text-emerald-700/80">
          進捗・送信ログに反映されました
        </div>
        <button
          onClick={handleUnmark}
          disabled={unmarking}
          className="text-[10.5px] text-emerald-700 underline hover:text-emerald-900 disabled:opacity-50"
        >
          {unmarking ? "取り消し中..." : "マークを取り消す"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 text-[13px] font-en font-medium bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] rounded-md disabled:opacity-50 transition-all"
    >
      <CheckCircle className="w-4 h-4" />
      ✓ 送信済みにマーク
    </button>
  );
}

function FieldCopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="px-2.5 py-1.5 bg-gray-50 border-b border-border flex items-center justify-between">
        <span className="text-[10px] font-en font-medium uppercase tracking-[.1em] text-muted">{label}</span>
        <button
          onClick={handleCopy}
          className={cn(
            "inline-flex items-center gap-1 text-[10px] font-en font-medium px-1.5 py-0.5 rounded",
            copied ? "bg-emerald-50 text-emerald-700" : "text-muted hover:text-ink hover:bg-gray-100"
          )}
        >
          {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
          {copied ? "コピーした" : "コピー"}
        </button>
      </div>
      <div className="px-2.5 py-2 text-[11px] text-ink-2 max-h-28 overflow-y-auto whitespace-pre-wrap break-words leading-relaxed">
        {value || <span className="text-muted">（空）</span>}
      </div>
    </div>
  );
}

function CopyAllButton({ fields }: { fields: Array<{ label: string; value: string }> }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const text = fields.map((f) => `【${f.label}】\n${f.value || ""}`).join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className={cn(
        "w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[11.5px] font-en font-medium rounded-md transition-colors",
        copied
          ? "bg-emerald-50 text-emerald-700"
          : "bg-gray-100 text-ink-2 hover:bg-gray-200"
      )}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "全部コピーした" : "全項目を一括コピー（書式: 【項目名】値）"}
    </button>
  );
}

function tomorrow10am(now: Date): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}
function tomorrow2pm(now: Date): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(14, 0, 0, 0);
  return d;
}
/** Date → "YYYY-MM-DDTHH:mm" 形式（datetime-local input用、ローカルTZ） */
function toLocalDatetimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 採用テンプレの選択ドロップダウン（複数 adopted がある時用）
 */
function TemplateDropdown({
  serviceId,
  value,
  onChange,
}: {
  serviceId: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [templates, setTemplates] = useState<any[]>([]);
  useEffect(() => {
    if (!serviceId) return;
    fetch(`/api/services/${serviceId}/templates`)
      .then((r) => r.json())
      .then((d) => {
        const adopted = (d.templates || []).filter((t: any) => t.status === "adopted");
        setTemplates(adopted);
      })
      .catch(() => {});
  }, [serviceId]);

  if (templates.length <= 1) return null;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-[11.5px] font-en font-medium px-2 py-1.5 border border-border rounded-md bg-white max-w-[180px]"
      title="再生成に使うテンプレを選択"
    >
      <option value="">テンプレ自動選択</option>
      {templates.map((t) => (
        <option key={t.id} value={t.id}>
          {t.label}
        </option>
      ))}
    </select>
  );
}

function stripMarkdown(md: string): string {
  return md
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}
