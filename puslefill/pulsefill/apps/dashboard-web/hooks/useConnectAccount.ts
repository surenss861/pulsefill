"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ConnectAccountSnapshot } from "@/types/payments";

const CONNECT_STATUS = "/v1/payments/connect/status";

export function useConnectAccount() {
  const [data, setData] = useState<ConnectAccountSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (opts?: { forceRefresh?: boolean }) => {
    try {
      setError(null);
      setLoading(true);
      const path = opts?.forceRefresh ? `${CONNECT_STATUS}?refresh=1` : CONNECT_STATUS;
      const res = await apiFetch<ConnectAccountSnapshot>(path);
      setData(res);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Couldn't load payout status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
