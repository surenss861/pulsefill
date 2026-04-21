import type { SupabaseClient } from "@supabase/supabase-js";

import { loadSlotRuleContext, type LoadedSlotRuleContext } from "./load-slot-rule-context.js";
import {
  buildAvailableActions,
  buildQueueContext,
  canPerformAction,
  type OperatorSlotAvailableAction,
  type SlotRuleSignals,
} from "./operator-slot-rules.js";

export type OperatorActionRejectionDetails = {
  attempted_action: OperatorSlotAvailableAction;
  slot_status: SlotRuleSignals["slotStatus"];
  queue_category: ReturnType<typeof buildQueueContext>["current_category"];
  available_actions: ReturnType<typeof buildAvailableActions>;
};

export function buildOperatorActionRejectionDetails(
  attemptedAction: OperatorSlotAvailableAction,
  signals: SlotRuleSignals,
): OperatorActionRejectionDetails {
  const queue_context = buildQueueContext(signals);
  const available_actions = buildAvailableActions(signals, queue_context);
  return {
    attempted_action: attemptedAction,
    slot_status: signals.slotStatus,
    queue_category: queue_context.current_category,
    available_actions,
  };
}

export type OperatorActionCheck =
  | { ok: true; loaded: LoadedSlotRuleContext }
  | { ok: false; status: 404 }
  | { ok: false; status: 409; details: OperatorActionRejectionDetails & Record<string, unknown> };

export async function checkOperatorActionAllowed(
  admin: SupabaseClient,
  params: {
    openSlotId: string;
    businessId: string;
    action: OperatorSlotAvailableAction;
    nowMs?: number;
  },
): Promise<OperatorActionCheck> {
  const loaded = await loadSlotRuleContext(admin, {
    openSlotId: params.openSlotId,
    businessId: params.businessId,
    nowMs: params.nowMs,
  });
  if (!loaded) return { ok: false, status: 404 };
  if (!canPerformAction(params.action, loaded.signals)) {
    return {
      ok: false,
      status: 409,
      details: buildOperatorActionRejectionDetails(params.action, loaded.signals),
    };
  }
  return { ok: true, loaded };
}

export type SendOrRetryCheck =
  | { ok: true; loaded: LoadedSlotRuleContext }
  | { ok: false; status: 404 }
  | {
      ok: false;
      status: 409;
      details: OperatorActionRejectionDetails & { attempted_actions: ["send_offers", "retry_offers"] };
    };

export async function checkSendOrRetryOffersAllowed(
  admin: SupabaseClient,
  params: { openSlotId: string; businessId: string; nowMs?: number },
): Promise<SendOrRetryCheck> {
  const loaded = await loadSlotRuleContext(admin, params);
  if (!loaded) return { ok: false, status: 404 };
  const can =
    canPerformAction("send_offers", loaded.signals) || canPerformAction("retry_offers", loaded.signals);
  if (!can) {
    const base = buildOperatorActionRejectionDetails("retry_offers", loaded.signals);
    return {
      ok: false,
      status: 409,
      details: {
        ...base,
        attempted_actions: ["send_offers", "retry_offers"],
      },
    };
  }
  return { ok: true, loaded };
}
