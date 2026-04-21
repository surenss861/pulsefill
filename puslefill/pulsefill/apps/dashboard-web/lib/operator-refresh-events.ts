import type { BulkSlotActionResponse } from "@/types/bulk-actions";

export type OperatorRefreshAction =
  | "confirm_booking"
  | "retry_offers"
  | "send_offers"
  | "expire_slot"
  | "cancel_slot"
  | "add_note";

export type OperatorRefreshDetail = {
  slotId: string;
  action: OperatorRefreshAction;
};

export type OperatorRefreshEventName = "slot:updated" | "slot:note_updated";

export function emitOperatorRefreshEvent(name: OperatorRefreshEventName, detail: OperatorRefreshDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<OperatorRefreshDetail>(name, { detail }));
}

export function subscribeOperatorRefreshEvent(
  name: OperatorRefreshEventName,
  handler: (detail: OperatorRefreshDetail) => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = (event: Event) => {
    const custom = event as CustomEvent<OperatorRefreshDetail>;
    if (custom.detail) handler(custom.detail);
  };

  window.addEventListener(name, listener as EventListener);
  return () => {
    window.removeEventListener(name, listener as EventListener);
  };
}

export function emitOperatorRefreshAfterBulkSlotAction(res: BulkSlotActionResponse): void {
  const action: OperatorRefreshAction = res.action === "expire" ? "expire_slot" : "retry_offers";
  for (const r of res.results) {
    if (r.status === "processed") {
      emitOperatorRefreshEvent("slot:updated", { slotId: r.open_slot_id, action });
    }
  }
}
