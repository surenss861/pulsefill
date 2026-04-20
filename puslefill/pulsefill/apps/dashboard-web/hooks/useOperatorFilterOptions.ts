"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { OperatorFilterOption } from "@/types/operator-filters";

type NamedRow = { id: string; name: string };

type State = {
  providers: OperatorFilterOption[];
  locations: OperatorFilterOption[];
  services: OperatorFilterOption[];
  loading: boolean;
  error: string | null;
};

export function useOperatorFilterOptions() {
  const [state, setState] = useState<State>({
    providers: [],
    locations: [],
    services: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [providers, locations, services] = await Promise.all([
          apiFetch<NamedRow[]>("/v1/providers"),
          apiFetch<NamedRow[]>("/v1/locations"),
          apiFetch<NamedRow[]>("/v1/services"),
        ]);

        if (cancelled) return;

        setState({
          providers: providers.map((x) => ({ id: x.id, label: x.name })),
          locations: locations.map((x) => ({ id: x.id, label: x.name })),
          services: services.map((x) => ({ id: x.id, label: x.name })),
          loading: false,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load filter options.",
        }));
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
