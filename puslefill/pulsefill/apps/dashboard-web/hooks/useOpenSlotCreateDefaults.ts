"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export type OpenSlotCreateDefaultsCombo = {
  location_id: string;
  provider_id: string;
  service_id: string;
  label: string;
  last_used_at: string;
};

export type OpenSlotCreateDefaultsPayload = {
  recent_combinations: OpenSlotCreateDefaultsCombo[];
  defaults: {
    location_id: string | null;
    provider_id: string | null;
    service_id: string | null;
  };
  setup_warnings: string[];
};

function parsePayload(raw: unknown): OpenSlotCreateDefaultsPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const recent = o.recent_combinations;
  const defaults = o.defaults;
  const warnings = o.setup_warnings;
  if (!Array.isArray(recent) || !defaults || typeof defaults !== "object" || !Array.isArray(warnings)) {
    return null;
  }
  const d = defaults as Record<string, unknown>;
  const combos: OpenSlotCreateDefaultsCombo[] = [];
  for (const item of recent) {
    if (!item || typeof item !== "object") continue;
    const c = item as Record<string, unknown>;
    if (
      typeof c.location_id === "string" &&
      typeof c.provider_id === "string" &&
      typeof c.service_id === "string" &&
      typeof c.label === "string" &&
      typeof c.last_used_at === "string"
    ) {
      combos.push({
        location_id: c.location_id,
        provider_id: c.provider_id,
        service_id: c.service_id,
        label: c.label,
        last_used_at: c.last_used_at,
      });
    }
  }
  return {
    recent_combinations: combos,
    defaults: {
      location_id: typeof d.location_id === "string" ? d.location_id : null,
      provider_id: typeof d.provider_id === "string" ? d.provider_id : null,
      service_id: typeof d.service_id === "string" ? d.service_id : null,
    },
    setup_warnings: warnings.filter((w): w is string => typeof w === "string"),
  };
}

export function useOpenSlotCreateDefaults(enabled: boolean) {
  const [data, setData] = useState<OpenSlotCreateDefaultsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const raw = await apiFetch<unknown>("/v1/open-slots/create-defaults");
      const parsed = parsePayload(raw);
      setData(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suggestions");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  return { data, loading, error, reload: load };
}
