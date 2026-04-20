import { getCustomerPushCopy } from "./customer-push-copy.js";
import { buildCustomerPushPayload, type CustomerPushEventType } from "./customer-push-payload.js";

export type BuildCustomerPushFromEventArgs = {
  kind: CustomerPushEventType;
  businessName?: string | null;
  serviceName?: string | null;
  offerId?: string;
  claimId?: string;
  openSlotId?: string;
};

/** Push alert copy + canonical `aps` / `data` envelope for customer notifications. */
export function buildCustomerPushFromCustomerEvent(args: BuildCustomerPushFromEventArgs) {
  const { title, body } = getCustomerPushCopy(args.kind, {
    businessName: args.businessName,
    serviceName: args.serviceName,
  });
  return buildCustomerPushPayload({
    type: args.kind,
    title,
    body,
    offerId: args.offerId,
    claimId: args.claimId,
    openSlotId: args.openSlotId,
  });
}
