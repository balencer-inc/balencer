"use client";

import useSWR, { mutate } from "swr";

export interface SenderPersonaLite {
  id: string;
  display_name: string;
  email_from: string;
  organization_id: string;
  signature_html: string | null;
  consent_at: string;
  active: boolean;
}

const SENDERS_KEY = "/api/sender-personas";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("sender personas fetch failed");
  return res.json();
};

export function useSenderPersonas() {
  const { data, error, isLoading } = useSWR<{ senders: SenderPersonaLite[] }>(SENDERS_KEY, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });
  return {
    senders: data?.senders || [],
    error,
    isLoading,
  };
}

export function refreshSenderPersonas() {
  return mutate(SENDERS_KEY);
}
