import { apiFetch } from "@/lib/api";
import { operatorActionMessageForCode } from "@/lib/operator-action-errors";

export type OperatorInlineActionKind = "confirm_booking" | "send_offers" | "retry_offers";

function rethrowWithOperatorCopy(err: unknown): never {
  if (err instanceof Error) {
    const code = (err as { code?: string }).code;
    if (code) {
      const mapped = operatorActionMessageForCode(code, err.message);
      const next = new Error(mapped);
      (next as { code?: string }).code = code;
      throw next;
    }
  }
  throw err;
}

export async function runOperatorInlineAction(args: {
  kind: OperatorInlineActionKind;
  openSlotId: string;
  claimId?: string | null;
}): Promise<unknown> {
  const { kind, openSlotId, claimId } = args;

  try {
    if (kind === "send_offers" || kind === "retry_offers") {
      return await apiFetch(`/v1/open-slots/${openSlotId}/send-offers`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    }

    if (kind === "confirm_booking") {
      if (!claimId) {
        throw new Error("Missing winning claim ID.");
      }

      return await apiFetch(`/v1/open-slots/${openSlotId}/confirm`, {
        method: "POST",
        body: JSON.stringify({ claim_id: claimId }),
      });
    }

    throw new Error("Unsupported operator inline action.");
  } catch (e) {
    rethrowWithOperatorCopy(e);
  }
}
