"use client";

import { useState, useTransition } from "react";
import { MessageCircle, X } from "lucide-react";
import { markReply } from "./actions";
import { cn } from "@/lib/utils";

interface Props {
  prospectId: string;
  hasReply: boolean;
  initialNote: string;
}

export function ReplyMarker({ prospectId, hasReply, initialNote }: Props) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(initialNote || "");
  const [pending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      await markReply(prospectId, true, note);
      setOpen(false);
    });
  };

  const handleClear = () => {
    startTransition(async () => {
      await markReply(prospectId, false, "");
      setOpen(false);
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-en font-medium whitespace-nowrap shrink-0",
          hasReply
            ? "bg-purple-50 text-purple-700 hover:bg-purple-100"
            : "bg-gray-100 text-muted hover:bg-gray-200"
        )}
      >
        <MessageCircle className="w-3 h-3" />
        {hasReply ? "返信あり ✓" : "返信あり?"}
      </button>
    );
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-md p-3 w-72 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-en font-medium text-purple-700">返信メモ</span>
        <button onClick={() => setOpen(false)} className="text-muted hover:text-ink">
          <X className="w-3 h-3" />
        </button>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="例: 「面談OK、5/22 14:00」「資料請求あり」"
        rows={3}
        className="w-full text-[11.5px] border border-purple-200 rounded p-2 focus:outline-none focus:border-purple-500"
      />
      <div className="flex gap-2 mt-2">
        {hasReply && (
          <button
            onClick={handleClear}
            disabled={pending}
            className="text-[10.5px] text-muted hover:text-red-600"
          >
            解除
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={pending}
          className="ml-auto px-3 py-1 text-[11px] font-en font-medium bg-purple-700 text-white rounded hover:bg-purple-800"
        >
          {pending ? "..." : "返信ありにする"}
        </button>
      </div>
    </div>
  );
}
