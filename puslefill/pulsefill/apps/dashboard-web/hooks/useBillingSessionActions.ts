"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "@/lib/api";

const BILLING_CHECKOUT = "/v1/billing/checkout";
const BILLING_PORTAL = "/v1/billing/portal";

export const BILLING_SESSION_ACTION_ERR = "Billing did not open. Try again in a moment.";

export function useBillingSessionActions() {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const startCheckout = useCallback(async () => {
    try {
      setSessionError(null);
      setCheckoutLoading(true);
      const res = await apiFetch<{ url: string }>(BILLING_CHECKOUT, { method: "POST", body: "{}" });
      if (res.url) window.location.assign(res.url);
      else setSessionError(BILLING_SESSION_ACTION_ERR);
    } catch {
      setSessionError(BILLING_SESSION_ACTION_ERR);
    } finally {
      setCheckoutLoading(false);
    }
  }, []);

  const openPortal = useCallback(async () => {
    try {
      setSessionError(null);
      setPortalLoading(true);
      const res = await apiFetch<{ url: string }>(BILLING_PORTAL, { method: "POST", body: "{}" });
      if (res.url) window.location.assign(res.url);
      else setSessionError(BILLING_SESSION_ACTION_ERR);
    } catch {
      setSessionError(BILLING_SESSION_ACTION_ERR);
    } finally {
      setPortalLoading(false);
    }
  }, []);

  return { startCheckout, openPortal, checkoutLoading, portalLoading, sessionError, setSessionError };
}
