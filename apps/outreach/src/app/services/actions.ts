"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const ORG_ID = "00000000-0000-0000-0000-000000000001";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50) || `service-${Date.now().toString(36)}`;
}

export async function createService(data: {
  name: string;
  slug?: string;
  pitch_axis?: string;
}) {
  if (!data.name.trim()) return { ok: false as const, error: "サービス名は必須です" };

  const supabase = createSupabaseAdminClient();
  const slug = data.slug?.trim() || slugify(data.name);

  // 重複チェック
  const { data: existing } = await supabase
    .from("services")
    .select("id")
    .eq("organization_id", ORG_ID)
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    return {
      ok: false as const,
      error: `slug "${slug}" は既に使われています。別の名前を指定してください`,
    };
  }

  const { data: inserted, error } = await supabase
    .from("services")
    .insert({
      organization_id: ORG_ID,
      slug,
      name: data.name.trim(),
      pitch_axis: data.pitch_axis?.trim() || null,
      cta_label: "オンラインで15分話す",
      cta_url: null,
      authority_block: {},
      target_audience: {},
      resource_links: [],
      active_template_ids: [],
      active: true,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { ok: false as const, error: error?.message || "作成失敗" };
  }

  revalidatePath("/services");
  return { ok: true as const, id: inserted.id };
}

export async function deleteService(id: string) {
  const supabase = createSupabaseAdminClient();

  // キャンペーンで使われている場合は非アクティブ化のみ
  const { count } = await supabase
    .from("campaigns")
    .select("id", { count: "exact", head: true })
    .eq("service_id", id);

  if ((count || 0) > 0) {
    const { error } = await supabase
      .from("services")
      .update({ active: false })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/services");
    return { ok: true, archived: true };
  }

  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/services");
  return { ok: true, archived: false };
}
