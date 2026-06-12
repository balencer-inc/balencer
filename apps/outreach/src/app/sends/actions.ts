"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function markReply(
  prospectId: string,
  hasReply: boolean,
  note: string
) {
  const supabase = createSupabaseAdminClient();
  const update: any = {
    replied_at: hasReply ? new Date().toISOString() : null,
    replied_note: hasReply ? note : null,
  };
  if (hasReply) {
    update.pipeline_stage = "replied";
    update.pipeline_updated_at = new Date().toISOString();
  }
  const { error } = await supabase.from("prospects").update(update).eq("id", prospectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/sends");
  revalidatePath("/pipeline");
  return { ok: true };
}

export async function updatePipelineStage(
  prospectId: string,
  stage: string,
  note?: string
) {
  const supabase = createSupabaseAdminClient();
  const update: any = {
    pipeline_stage: stage,
    pipeline_updated_at: new Date().toISOString(),
  };
  if (note !== undefined) update.pipeline_note = note;
  const { error } = await supabase.from("prospects").update(update).eq("id", prospectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pipeline");
  revalidatePath("/sends");
  return { ok: true };
}

// 送信ログを複数件まとめて削除 (失敗履歴のクリーンアップ用)
// CASCADEで events も自動削除される
export async function deleteSends(sendIds: string[]) {
  if (sendIds.length === 0) return { ok: true, deleted: 0 };

  const supabase = createSupabaseAdminClient();
  const { error, count } = await supabase
    .from("sends")
    .delete({ count: "exact" })
    .in("id", sendIds);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/sends");
  return { ok: true, deleted: count || 0 };
}
