import type { OperatorSlotsFilter, OperatorSlotsListItem } from "@/types/operator-slots-list";

/** Canonical dashboard route for operator open-slot detail (`app/(protected)/open-slots/[id]/page.tsx`). */
export function openSlotDetailPath(openSlotId: string, params?: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `/open-slots/${openSlotId}?${qs}` : `/open-slots/${openSlotId}`;
}

export type QueueDetailSection = "needs_action" | "review" | "resolved";

export function queueDetailPath(openSlotId: string, section?: QueueDetailSection): string {
  const p: Record<string, string> = { from: "queue" };
  if (section) p.section = section;
  return openSlotDetailPath(openSlotId, p);
}

export type SlotsDetailParams = {
  status?: string;
  attention?: string;
  q?: string;
  digest?: string;
  digest_slot_ids?: string;
};

export function slotsDetailPath(openSlotId: string, params?: SlotsDetailParams): string {
  const p: Record<string, string> = { from: "slots" };
  if (params?.status) p.status = params.status;
  if (params?.attention) p.attention = params.attention;
  if (params?.q) p.q = params.q;
  if (params?.digest) p.digest = params.digest;
  if (params?.digest_slot_ids) p.digest_slot_ids = params.digest_slot_ids;
  return openSlotDetailPath(openSlotId, p);
}

export function activityDetailPath(openSlotId: string): string {
  return openSlotDetailPath(openSlotId, { from: "activity" });
}

export function claimsDetailPath(openSlotId: string): string {
  return openSlotDetailPath(openSlotId, { from: "claims" });
}

export function outcomesDetailPath(openSlotId: string): string {
  return openSlotDetailPath(openSlotId, { from: "outcomes" });
}

/** Map list row → attention query (subset of queue-style attention keys). */
export function slotRowAttentionParam(slot: OperatorSlotsListItem): string | undefined {
  const st = (slot.status || "").toLowerCase();
  if (st === "claimed") return "awaiting_confirmation";
  if (st === "offered") return "offered_active";
  return undefined;
}

export function slotsDetailParamsFromListContext(args: {
  filter: OperatorSlotsFilter;
  slot: OperatorSlotsListItem;
  digestKind?: string | null;
  digestSlotIds?: string | null;
  q?: string | null;
}): SlotsDetailParams {
  const out: SlotsDetailParams = {};
  if (args.filter !== "all") out.status = args.filter;
  const att = slotRowAttentionParam(args.slot);
  if (att) out.attention = att;
  if (args.q?.trim()) out.q = args.q.trim();
  if (args.digestKind?.trim()) out.digest = args.digestKind.trim();
  if (args.digestSlotIds?.trim()) out.digest_slot_ids = args.digestSlotIds.trim();
  return out;
}

export type OpenSlotBackParams = {
  from?: string | null;
  section?: string | null;
  status?: string | null;
  attention?: string | null;
  q?: string | null;
  digest?: string | null;
  digest_slot_ids?: string | null;
};

export function getOpenSlotBackLink(params: OpenSlotBackParams): { label: string; href: string } {
  const from = params.from ?? "";

  if (from === "queue") {
    const search = new URLSearchParams();
    const sec = params.section;
    if (sec && sec !== "all" && ["needs_action", "review", "resolved"].includes(sec)) {
      search.set("section", sec);
    }
    const qs = search.toString();
    return {
      label: "Back to Recovery Queue",
      href: qs ? `/action-queue?${qs}` : "/action-queue",
    };
  }

  if (from === "slots") {
    const search = new URLSearchParams();
    if (params.status) search.set("status", params.status);
    if (params.attention) search.set("attention", params.attention);
    if (params.q) search.set("q", params.q);
    if (params.digest) search.set("digest", params.digest);
    if (params.digest_slot_ids) search.set("digest_slot_ids", params.digest_slot_ids);
    const qs = search.toString();
    return {
      label: "Back to Open Slots",
      href: qs ? `/open-slots?${qs}` : "/open-slots",
    };
  }

  if (from === "activity") {
    return { label: "Back to Activity", href: "/activity" };
  }

  if (from === "claims") {
    return { label: "Back to Claims", href: "/claims" };
  }

  if (from === "outcomes") {
    return { label: "Back to Outcomes", href: "/outcomes" };
  }

  return { label: "Back to Open Slots", href: "/open-slots" };
}
