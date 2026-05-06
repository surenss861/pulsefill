import type { SupabaseClient } from "@supabase/supabase-js";

import { customerBelongsToStaffBusiness } from "./operator-customer-context.js";

const MAX_ITEMS = 100;
/** Max length for note preview in timeline metadata (staff-safe). */
export const CUSTOMER_TIMELINE_PREVIEW_MAX = 140;

export type CustomerTimelineItemKind =
  | "customer_joined_business"
  | "standby_preferences_saved"
  | "opening_alert_sent"
  | "claim_submitted"
  | "claim_confirmed"
  | "internal_note_added"
  | "follow_up_scheduled"
  | "follow_up_completed";

export type CustomerTimelineSeverity = "info" | "attention" | "success" | "muted";

export type CustomerTimelineItem = {
  id: string;
  kind: CustomerTimelineItemKind;
  title: string;
  description: string;
  occurred_at: string;
  source: "membership" | "standby" | "notification" | "claim" | "note";
  severity: CustomerTimelineSeverity;
  metadata: Record<string, string>;
};

export type CustomerTimelineResponse = {
  customer_id: string;
  items: CustomerTimelineItem[];
};

export function previewNoteBodyForTimeline(body: string): string {
  const t = body.trim().replace(/\s+/g, " ");
  if (t.length <= CUSTOMER_TIMELINE_PREVIEW_MAX) return t;
  return `${t.slice(0, CUSTOMER_TIMELINE_PREVIEW_MAX - 1)}…`;
}

function pickIso(a: string | null | undefined, b: string | null | undefined): string {
  const sa = a?.trim() || "";
  const sb = b?.trim() || "";
  if (!sa) return sb;
  if (!sb) return sa;
  return new Date(sa) >= new Date(sb) ? sa : sb;
}

let buildCustomerTimelineTestDelegate:
  | null
  | ((admin: SupabaseClient, businessId: string, customerId: string) => Promise<CustomerTimelineResponse>) = null;

export function setBuildCustomerTimelineTestDelegate(
  delegate: ((admin: SupabaseClient, businessId: string, customerId: string) => Promise<CustomerTimelineResponse>) | null,
): void {
  if (delegate != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("customer timeline test delegate only when PULSEFILL_API_TEST=1");
  }
  buildCustomerTimelineTestDelegate = delegate;
}

function sortTimelineItems(items: CustomerTimelineItem[]): CustomerTimelineItem[] {
  const out = [...items];
  out.sort((a, b) => {
    const ta = new Date(a.occurred_at).getTime();
    const tb = new Date(b.occurred_at).getTime();
    if (tb !== ta) return tb - ta;
    return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
  });
  return out.slice(0, MAX_ITEMS);
}

export async function buildCustomerTimeline(
  admin: SupabaseClient,
  businessId: string,
  customerId: string,
): Promise<CustomerTimelineResponse> {
  if (buildCustomerTimelineTestDelegate) {
    const raw = await buildCustomerTimelineTestDelegate(admin, businessId, customerId);
    return { customer_id: raw.customer_id, items: sortTimelineItems(raw.items) };
  }

  const allowed = await customerBelongsToStaffBusiness(admin, businessId, customerId);
  if (!allowed) {
    throw new Error("customer_timeline_not_found");
  }

  const items: CustomerTimelineItem[] = [];

  const [{ data: memRow }, { data: pendingReq }] = await Promise.all([
    admin
      .from("customer_business_memberships")
      .select("id, status, source, created_at")
      .eq("customer_id", customerId)
      .eq("business_id", businessId)
      .maybeSingle(),
    admin
      .from("customer_standby_requests")
      .select("id, requested_at, status")
      .eq("customer_id", customerId)
      .eq("business_id", businessId)
      .eq("status", "pending")
      .maybeSingle(),
  ]);

  if (memRow && typeof (memRow as { status?: string }).status === "string") {
    const m = memRow as { id: string; status: string; source: string; created_at: string };
    if (m.status === "active") {
      const src = m.source === "request" || m.source === "public" || m.source === "invite" ? m.source : "invite";
      items.push({
        id: `membership:${m.id}`,
        kind: "customer_joined_business",
        title: "Joined business",
        description: "Customer connected to this business.",
        occurred_at: m.created_at,
        source: "membership",
        severity: "success",
        metadata: { membership_id: m.id, source: src },
      });
    }
  } else if (pendingReq && typeof (pendingReq as { requested_at?: string }).requested_at === "string") {
    const r = pendingReq as { id: string; requested_at: string };
    items.push({
      id: `standby_request:${r.id}`,
      kind: "customer_joined_business",
      title: "Standby access requested",
      description: "Customer requested to join this business.",
      occurred_at: r.requested_at,
      source: "membership",
      severity: "attention",
      metadata: { request_id: r.id },
    });
  }

  const { data: prefRows, error: prefErr } = await admin
    .from("standby_preferences")
    .select("id, created_at, updated_at")
    .eq("customer_id", customerId)
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false })
    .limit(30);

  if (!prefErr && prefRows) {
    for (const raw of prefRows) {
      const p = raw as { id: string; created_at: string; updated_at: string | null };
      const at = pickIso(p.updated_at, p.created_at);
      items.push({
        id: `standby_pref:${p.id}:${at}`,
        kind: "standby_preferences_saved",
        title: "Standby preferences updated",
        description: "Customer changed the openings they want to hear about.",
        occurred_at: at,
        source: "standby",
        severity: "info",
        metadata: { preference_id: p.id },
      });
    }
  }

  const { data: notifRows, error: notifErr } = await admin
    .from("notification_logs")
    .select("id, created_at, open_slots!inner(business_id)")
    .eq("customer_id", customerId)
    .eq("open_slots.business_id", businessId)
    .eq("status", "delivered")
    .order("created_at", { ascending: false })
    .limit(40);

  if (!notifErr && notifRows) {
    for (const raw of notifRows) {
      const row = raw as { id: string; created_at: string };
      items.push({
        id: `notification:${row.id}`,
        kind: "opening_alert_sent",
        title: "Opening alert sent",
        description: "PulseFill sent an opening alert.",
        occurred_at: row.created_at,
        source: "notification",
        severity: "info",
        metadata: {},
      });
    }
  }

  const { data: claimRows, error: claimErr } = await admin
    .from("slot_claims")
    .select("id, status, claimed_at, confirmed_at, open_slots!inner(business_id)")
    .eq("customer_id", customerId)
    .eq("open_slots.business_id", businessId)
    .order("claimed_at", { ascending: false })
    .limit(40);

  if (!claimErr && claimRows) {
    for (const raw of claimRows) {
      const row = raw as {
        id: string;
        status: string;
        claimed_at: string;
        confirmed_at?: string | null;
      };
      const st = String(row.status || "").toLowerCase();
      items.push({
        id: `claim:${row.id}:submitted`,
        kind: "claim_submitted",
        title: "Claim sent",
        description: "Customer claimed an opening.",
        occurred_at: row.claimed_at,
        source: "claim",
        severity: "info",
        metadata: { claim_id: row.id },
      });
      if (st === "confirmed" && row.confirmed_at) {
        items.push({
          id: `claim:${row.id}:confirmed`,
          kind: "claim_confirmed",
          title: "Booking confirmed",
          description: "Staff confirmed the customer's booking.",
          occurred_at: row.confirmed_at,
          source: "claim",
          severity: "success",
          metadata: { claim_id: row.id },
        });
      }
    }
  }

  let noteRows: unknown[] | null = null;
  {
    const full = await admin
      .from("customer_notes")
      .select("id, body, created_at, updated_at, follow_up_at, follow_up_completed_at")
      .eq("business_id", businessId)
      .eq("customer_id", customerId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!full.error && full.data) {
      noteRows = full.data;
    } else {
      const minimal = await admin
        .from("customer_notes")
        .select("id, body, created_at, updated_at")
        .eq("business_id", businessId)
        .eq("customer_id", customerId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!minimal.error && minimal.data) noteRows = minimal.data;
    }
  }

  if (noteRows) {
    for (const raw of noteRows) {
      const n = raw as {
        id: string;
        body: string;
        created_at: string;
        updated_at: string | null;
        follow_up_at?: string | null;
        follow_up_completed_at?: string | null;
      };
      const preview = previewNoteBodyForTimeline(n.body);
      items.push({
        id: `note:${n.id}:added`,
        kind: "internal_note_added",
        title: "Internal note added",
        description: "A staff note was added for this customer.",
        occurred_at: n.created_at,
        source: "note",
        severity: "muted",
        metadata: { note_id: n.id, preview },
      });
      if (n.follow_up_at) {
        const scheduledAt = pickIso(n.updated_at, n.created_at);
        items.push({
          id: `note:${n.id}:follow_scheduled`,
          kind: "follow_up_scheduled",
          title: "Follow-up scheduled",
          description: "Staff scheduled a follow-up.",
          occurred_at: scheduledAt,
          source: "note",
          severity: "attention",
          metadata: { note_id: n.id, preview },
        });
      }
      if (n.follow_up_completed_at) {
        items.push({
          id: `note:${n.id}:follow_done`,
          kind: "follow_up_completed",
          title: "Follow-up completed",
          description: "Staff completed a follow-up.",
          occurred_at: n.follow_up_completed_at,
          source: "note",
          severity: "success",
          metadata: { note_id: n.id, preview },
        });
      }
    }
  }

  return {
    customer_id: customerId,
    items: sortTimelineItems(items),
  };
}
