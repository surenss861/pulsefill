"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, fetchAllPages } from "@/lib/api";

export type SetupOverviewData = {
  locationsCount: number;
  providersCount: number;
  servicesCount: number;
  openSlotsCount: number;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

type OpenSlotsResponse = { openSlots?: unknown[]; pagination?: { hasMore: boolean } };

export function useSetupOverviewData(): SetupOverviewData {
  const [locationsCount, setLocationsCount] = useState(0);
  const [providersCount, setProvidersCount] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);
  const [openSlotsCount, setOpenSlotsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [locations, providers, services, openSlots] = await Promise.all([
        apiFetch<unknown[]>("/v1/locations"),
        apiFetch<unknown[]>("/v1/providers"),
        apiFetch<unknown[]>("/v1/services"),
        fetchAllPages<unknown>("/v1/open-slots", (page) => {
          const p = page as OpenSlotsResponse;
          return { items: p.openSlots ?? [], hasMore: p.pagination?.hasMore ?? false };
        }),
      ]);

      setLocationsCount(Array.isArray(locations) ? locations.length : 0);
      setProvidersCount(Array.isArray(providers) ? providers.length : 0);
      setServicesCount(Array.isArray(services) ? services.length : 0);
      setOpenSlotsCount(openSlots.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load setup overview data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    locationsCount,
    providersCount,
    servicesCount,
    openSlotsCount,
    loading,
    error,
    reload: load,
  };
}
