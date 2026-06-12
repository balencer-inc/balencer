"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const ORG_ID = "00000000-0000-0000-0000-000000000001";

export async function updateSenderPersona(
  id: string,
  data: {
    display_name: string;
    email_from: string;
    signature_html: string;
  }
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("sender_personas").update(data).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function createSenderPersona(data: {
  display_name: string;
  email_from: string;
  signature_html: string;
}) {
  if (!data.display_name.trim()) return { ok: false as const, error: "表示名は必須です" };
  if (!data.email_from.includes("@")) return { ok: false as const, error: "正しいメールアドレスを入れてください" };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("sender_personas").insert({
    organization_id: ORG_ID,
    display_name: data.display_name,
    email_from: data.email_from,
    signature_html: data.signature_html || null,
    consent_at: new Date().toISOString(),
    active: true,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/campaigns/new");
  return { ok: true as const };
}

export async function deleteSenderPersona(id: string) {
  const supabase = createSupabaseAdminClient();

  // 使われていないか確認
  const { count } = await supabase
    .from("campaigns")
    .select("id", { count: "exact", head: true })
    .eq("sender_persona_id", id);

  if ((count || 0) > 0) {
    // 削除せず非アクティブ化
    const { error } = await supabase
      .from("sender_personas")
      .update({ active: false })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/settings");
    return { ok: true, archived: true };
  }

  const { error } = await supabase.from("sender_personas").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true, archived: false };
}
