"use client";

import { OperatorErrorState } from "@/components/operator/operator-error-state";
import { OperatorLoadingState } from "@/components/operator/operator-loading-state";
import { OperatorRow, OperatorRowList } from "@/components/operator/operator-row-list";
import { OperatorStatusChip } from "@/components/operator/operator-status-chip";
import type { OperatorStatusKind } from "@/components/operator/operator-status-chip";
import {
  presentDeliveryChannel,
  presentDeliveryReason,
  presentDeliveryStatus,
  sortDeliveryItemsForDisplay,
} from "@/lib/notification-delivery-presenters";
import type { NotificationDeliveryItem, NotificationDeliveryItemStatus } from "@/types/notification-delivery";

function statusToChipKind(status: NotificationDeliveryItemStatus): OperatorStatusKind {
  if (status === "sent") return "confirmed";
  if (status === "failed") return "failed";
  if (status === "simulated") return "pending";
  return "attention";
}

type Props = {
  loading: boolean;
  error: string | null;
  items: NotificationDeliveryItem[];
  summary: { sent: number; failed: number; skipped: number; simulated: number } | null;
};

export function NotificationDeliveryStatusSection({ loading, error, items, summary }: Props) {
  if (loading) {
    return <OperatorLoadingState variant="section" title="Loading delivery status…" />;
  }
  if (error) {
    return <OperatorErrorState title="Could not load delivery" rawMessage={error} compact />;
  }

  const rows = sortDeliveryItemsForDisplay(items);
  const s = summary ?? { sent: 0, failed: 0, skipped: 0, simulated: 0 };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <OperatorStatusChip kind="confirmed" label={`Sent · ${s.sent}`} />
        <OperatorStatusChip kind="attention" label={`Skipped · ${s.skipped}`} />
        <OperatorStatusChip kind="failed" label={`Failed · ${s.failed}`} />
        <OperatorStatusChip kind="pending" label={`Simulated · ${s.simulated}`} />
      </div>

      <OperatorRowList
        emptyState={
          <p style={{ margin: 0, fontSize: 13, color: "rgba(245,247,250,0.45)" }}>
            No delivery events yet. Delivery appears after offers are sent.
          </p>
        }
      >
        {rows.map((it) => (
          <OperatorRow
            key={it.id}
            title={it.customer_label}
            meta={
              <span className="pf-muted-copy" style={{ fontSize: 12 }}>
                {new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short" }).format(
                  new Date(it.created_at),
                )}
                {" · "}
                {presentDeliveryChannel(it.channel)} · {presentDeliveryReason(it.reason)}
              </span>
            }
            status={
              <OperatorStatusChip kind={statusToChipKind(it.status)} label={presentDeliveryStatus(it.status)} />
            }
          />
        ))}
      </OperatorRowList>
    </div>
  );
}
