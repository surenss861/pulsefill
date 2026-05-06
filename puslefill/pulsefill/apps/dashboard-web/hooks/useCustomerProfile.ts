"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export type CustomerProfileMembership = {
  status: "active" | "pending" | "revoked" | "none";
  source: "invite" | "request" | "public" | null;
  joined_at: string | null;
};

export type CustomerProfileFollowUp = {
  contact_email: string | null;
  contact_phone: string | null;
  can_email: boolean;
  can_call: boolean;
  suggested_action: "review_request" | "invite_customer" | "none";
};

export type CustomerProfilePayload = {
  customer: {
    id: string;
    display_name: string;
    email: string | null;
    phone: string | null;
    created_at: string;
  };
  membership: CustomerProfileMembership;
  follow_up: CustomerProfileFollowUp;
  standby: {
    active_preferences_count: number;
    services: Array<{ id: string; name: string }>;
    locations: Array<{ id: string; name: string }>;
    notice_summary: string;
    availability_summary: string;
  };
  reachability: {
    push_enabled: boolean;
    active_push_devices: number;
    email_enabled: boolean;
    sms_enabled: boolean;
    status: "reachable" | "limited" | "unreachable";
  };
  claims: {
    total: number;
    confirmed: number;
    waiting: number;
    expired_or_missed: number;
  };
  recent_activity: Array<{
    kind: string;
    title: string;
    description: string;
    occurred_at: string;
  }>;
  notification_delivery: {
    sent_30d: number;
    failed_30d: number;
    skipped_30d: number;
  };
  next_actions: Array<{
    label: string;
    href: string;
    priority: "primary" | "secondary";
  }>;
};

export function useCustomerProfile(customerId: string | undefined) {
  const [data, setData] = useState<CustomerProfilePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!customerId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<CustomerProfilePayload>(
        `/v1/businesses/mine/customers/${customerId}/profile`,
      );
      setData(res);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Failed to load customer profile.");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
