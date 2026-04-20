"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { OperatorBulkActionConfirmModal } from "@/components/slots/operator-bulk-action-confirm-modal";
import { OperatorBulkActionResult } from "@/components/slots/operator-bulk-action-result";
import { useToast } from "@/components/ui/toast-provider";
import { useOperatorMorningRecoveryDigest } from "@/hooks/useOperatorMorningRecoveryDigest";
import { runDigestSectionAction } from "@/lib/operator-digest-actions";
import { getDigestActionLabel, priorityChipStyle } from "@/lib/morning-recovery-digest-ui";
import type { BulkSlotActionKind, BulkSlotActionResponse } from "@/types/bulk-actions";
import type { MorningRecoveryDigestSection } from "@/types/morning-recovery-digest";

type Props = {
  /** Called after a successful bulk retry so the parent can refresh queue, metrics, etc. */
  onAfterMutation?: () => void | Promise<void>;
};

export function OperatorMorningRecoveryDigestPanel({ onAfterMutation }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const { data, loading, error, reload } = useOperatorMorningRecoveryDigest(0);

  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkPendingSection, setBulkPendingSection] = useState<MorningRecoveryDigestSection | null>(null);
  const [bulkPendingAction, setBulkPendingAction] = useState<BulkSlotActionKind | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkSlotActionResponse | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);

  const refreshRelated = useCallback(async () => {
    await reload({ silent: true });
    await onAfterMutation?.();
  }, [reload, onAfterMutation]);

  function openReviewSlots(section: MorningRecoveryDigestSection) {
    const q = new URLSearchParams();
    q.set("digest", section.kind);
    if (section.slot_ids.length > 0) {
      q.set("digest_slot_ids", section.slot_ids.join(","));
    }
    router.push(`/open-slots?${q.toString()}`);
  }

  function startBulkRetry(section: MorningRecoveryDigestSection) {
    if (section.slot_ids.length === 0) return;
    setBulkPendingSection(section);
    setBulkPendingAction("retry_offers");
    setBulkConfirmOpen(true);
  }

  async function confirmBulk() {
    if (!bulkPendingSection || !bulkPendingAction) return;
    setBulkConfirmOpen(false);
    setBulkRunning(true);
    try {
      const res = await runDigestSectionAction(bulkPendingSection);
      if (res) {
        setBulkResult(res);
        showToast({
          title: "Bulk retry complete",
          tone: res.summary.failed > 0 ? "info" : "success",
        });
      }
      await refreshRelated();
    } catch (err) {
      showToast({
        title: err instanceof Error ? err.message : "Bulk action failed",
        tone: "error",
      });
    } finally {
      setBulkRunning(false);
      setBulkPendingSection(null);
      setBulkPendingAction(null);
    }
  }

  if (loading && !data) {
    return (
      <section style={{ marginTop: 28 }}>
        <h2 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 650 }}>Morning recovery digest</h2>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading digest…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section style={{ marginTop: 28 }}>
        <h2 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 650 }}>Morning recovery digest</h2>
        <p style={{ color: "#f87171", fontSize: 14 }}>{error}</p>
      </section>
    );
  }

  if (!data) return null;

  const { summary, sections, generated_at } = data;

  return (
    <section style={{ marginTop: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 650 }}>Morning recovery digest</h2>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          Updated {new Date(generated_at).toLocaleString()}
        </span>
      </div>
      <p style={{ margin: "8px 0 16px 0", fontSize: 13, color: "var(--muted)", maxWidth: 720 }}>
        Act on grouped openings from today&apos;s queue. &quot;Retry all&quot; uses the same bulk offer flow as Open
        slots.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <DigestStat label="Retry now" value={summary.retry_now_count} />
        <DigestStat label="Later / waiting" value={summary.quiet_hours_ready_count} />
        <DigestStat label="Manual follow-up" value={summary.manual_follow_up_count} />
        <DigestStat label="Improve coverage" value={summary.expand_match_pool_count} />
      </div>

      {sections.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>Nothing grouped in the digest right now.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sections.map((section) => {
            const chip = priorityChipStyle(section.priority);
            const cta =
              section.action_type === "bulk_retry_offers"
                ? () => startBulkRetry(section)
                : () => openReviewSlots(section);
            const ctaLabel = getDigestActionLabel(section.action_type, section.action_label);
            return (
              <article
                key={section.kind}
                style={{
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 650 }}>{section.title}</h3>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 650,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          padding: "4px 8px",
                          borderRadius: 8,
                          ...chip,
                        }}
                      >
                        {section.priority} priority
                      </span>
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>{section.count} slots</span>
                    </div>
                    <p style={{ margin: "10px 0 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.5, maxWidth: 640 }}>
                      {section.detail}
                    </p>
                  </div>
                  <div style={{ alignSelf: "flex-start" }}>
                    <button
                      type="button"
                      onClick={cta}
                      disabled={section.count === 0}
                      style={{
                        borderRadius: 12,
                        padding: "10px 16px",
                        border: "none",
                        background: section.action_type === "bulk_retry_offers" ? "var(--primary)" : "rgba(255,255,255,0.1)",
                        color: section.action_type === "bulk_retry_offers" ? "#0a0c10" : "var(--text)",
                        fontWeight: 650,
                        fontSize: 13,
                        cursor: section.count === 0 ? "not-allowed" : "pointer",
                        opacity: section.count === 0 ? 0.5 : 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ctaLabel}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <OperatorBulkActionConfirmModal
        open={bulkConfirmOpen}
        action={bulkPendingAction}
        count={bulkPendingSection?.slot_ids.length ?? 0}
        onConfirm={() => void confirmBulk()}
        onCancel={() => {
          setBulkConfirmOpen(false);
          setBulkPendingSection(null);
          setBulkPendingAction(null);
        }}
        busy={bulkRunning}
      />

      <OperatorBulkActionResult
        result={bulkResult}
        onDismiss={() => {
          setBulkResult(null);
        }}
      />
    </section>
  );
}

function DigestStat({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "12px 14px",
        background: "rgba(0,0,0,0.2)",
      }}
    >
      <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.03em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}
