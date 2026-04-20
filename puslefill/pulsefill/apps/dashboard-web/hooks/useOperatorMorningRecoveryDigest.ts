"use client";

import { useCallback, useEffect, useState } from "react";
import { getOperatorMorningRecoveryDigest } from "@/lib/operator-morning-recovery-digest";
import type { MorningRecoveryDigestResponse } from "@/types/morning-recovery-digest";

export function useOperatorMorningRecoveryDigest(pollMs = 0) {
  const [data, setData] = useState<MorningRecoveryDigestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const res = await getOperatorMorningRecoveryDigest();
      setData(res);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : "Failed to load morning recovery digest");
        setData(null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (pollMs <= 0) return;
    const id = setInterval(() => void load(true), pollMs);
    return () => clearInterval(id);
  }, [load, pollMs]);

  const reload = useCallback(
    (opts?: { silent?: boolean }) => load(opts?.silent ?? false),
    [load],
  );

  return { data, loading, error, reload };
}
