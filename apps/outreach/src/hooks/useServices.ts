"use client";

import useSWR, { mutate } from "swr";

export interface ServiceLite {
  id: string;
  slug: string;
  name: string;
  organization_id: string;
  pitch_axis: string | null;
  source_material: string | null;
  active_template_ids: string[] | null;
  authority_block: Record<string, unknown>;
  cta_label: string | null;
  cta_url: string | null;
  resource_links: unknown[];
  target_audience: Record<string, unknown>;
}

const SERVICES_KEY = "/api/services";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("services fetch failed");
  return res.json();
};

export function useServices() {
  const { data, error, isLoading } = useSWR<{ services: ServiceLite[] }>(SERVICES_KEY, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });
  return {
    services: data?.services || [],
    error,
    isLoading,
  };
}

/** 作成/編集/削除後に呼ぶ。SWR が再フェッチして全てのコンシューマが即更新される */
export function refreshServices() {
  return mutate(SERVICES_KEY);
}
