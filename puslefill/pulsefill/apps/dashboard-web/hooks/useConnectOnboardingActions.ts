"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "@/lib/api";

const CONNECT_ONBOARDING_LINK = "/v1/payments/connect/onboarding-link";

export const CONNECT_ONBOARDING_ACTION_ERR = "Payout setup did not open. Try again in a moment.";

export function useConnectOnboardingActions() {
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const startOnboarding = useCallback(async () => {
    try {
      setSessionError(null);
      setOnboardingLoading(true);
      const res = await apiFetch<{ url: string }>(CONNECT_ONBOARDING_LINK, { method: "POST", body: "{}" });
      if (res.url) window.location.assign(res.url);
      else setSessionError(CONNECT_ONBOARDING_ACTION_ERR);
    } catch {
      setSessionError(CONNECT_ONBOARDING_ACTION_ERR);
    } finally {
      setOnboardingLoading(false);
    }
  }, []);

  return { startOnboarding, onboardingLoading, sessionError, setSessionError };
}
