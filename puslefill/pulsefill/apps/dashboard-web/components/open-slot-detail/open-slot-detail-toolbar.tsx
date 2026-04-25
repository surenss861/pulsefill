"use client";

import Link from "next/link";
import { RefreshIndicator } from "@/components/ui/refresh-indicator";

type Props = {
  refreshedAt: Date | null;
  backHref: string;
  backLabel: string;
  sourceChip?: string | null;
};

export function OpenSlotDetailToolbar({ refreshedAt, backHref, backLabel, sourceChip }: Props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        marginBottom: 6,
        paddingBottom: 2,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Link
          href={backHref}
          prefetch={false}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(245,247,250,0.48)",
            textDecoration: "none",
          }}
        >
          {backLabel}
        </Link>
        {sourceChip ? (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              borderRadius: 999,
              padding: "4px 8px",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(245,247,250,0.38)",
            }}
          >
            {sourceChip}
          </span>
        ) : null}
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            borderRadius: 999,
            padding: "4px 9px",
            border: "1px solid rgba(255, 122, 24, 0.22)",
            background: "rgba(255, 122, 24, 0.08)",
            color: "#ffb070",
          }}
        >
          Live detail
        </span>
      </div>
      <div style={{ opacity: 0.92 }}>
        <RefreshIndicator updatedAt={refreshedAt} />
      </div>
    </div>
  );
}
