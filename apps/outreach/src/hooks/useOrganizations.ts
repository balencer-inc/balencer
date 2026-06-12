"use client";

import useSWR, { mutate } from "swr";

export interface OrganizationLite {
  id: string;
  slug: string;
  name: string;
  display_address: string | null;
}

const ORGS_KEY = "/api/organizations";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("organizations fetch failed");
  return res.json();
};

export function useOrganizations() {
  const { data, error, isLoading } = useSWR<{ organizations: OrganizationLite[] }>(
    ORGS_KEY,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
  return {
    organizations: data?.organizations || [],
    error,
    isLoading,
  };
}

export function refreshOrganizations() {
  return mutate(ORGS_KEY);
}
