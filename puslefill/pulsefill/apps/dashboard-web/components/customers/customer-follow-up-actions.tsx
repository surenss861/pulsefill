"use client";

import Link from "next/link";
import { useCallback, useState, type CSSProperties } from "react";
import { MotionAction } from "@/components/operator/operator-motion-primitives";
import { actionLinkStyle } from "@/lib/operator-action-link-styles";
import type { CustomerProfileFollowUp } from "@/hooks/useCustomerProfile";
import { buildStaffMailtoHref, buildTelHref, copyTextWithOptionalClipboard } from "@/lib/customer-follow-up";
import { operatorSurfaceShell } from "@/lib/operator-surface-styles";

type Props = {
  follow_up: CustomerProfileFollowUp;
};

const btn: CSSProperties = {
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--text)",
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

export function CustomerFollowUpActions({ follow_up }: Props) {
  const [copyHint, setCopyHint] = useState<string | null>(null);

  const flash = useCallback((msg: string) => {
    setCopyHint(msg);
    window.setTimeout(() => setCopyHint(null), 2200);
  }, []);

  const onCopyEmail = useCallback(async () => {
    const raw = follow_up.contact_email;
    if (!raw) return;
    const r = await copyTextWithOptionalClipboard(raw);
    if (r === "copied") flash("Copied email");
    else if (r === "unavailable") flash("Clipboard unavailable");
    else flash("Could not copy");
  }, [follow_up.contact_email, flash]);

  const onCopyPhone = useCallback(async () => {
    const raw = follow_up.contact_phone;
    if (!raw) return;
    const r = await copyTextWithOptionalClipboard(raw);
    if (r === "copied") flash("Copied phone");
    else if (r === "unavailable") flash("Clipboard unavailable");
    else flash("Could not copy");
  }, [follow_up.contact_phone, flash]);

  const mail = follow_up.can_email && follow_up.contact_email ? buildStaffMailtoHref(follow_up.contact_email) : null;
  const tel = follow_up.can_call && follow_up.contact_phone ? buildTelHref(follow_up.contact_phone) : null;

  return (
    <section style={{ padding: "14px 16px", ...operatorSurfaceShell("quiet") }}>
      <p className="pf-kicker" style={{ margin: 0, fontSize: 10 }}>
        Follow-up
      </p>
      <h2 className="pf-section-title" style={{ fontSize: 15, margin: "6px 0 0" }}>
        Contact & access
      </h2>
      <p className="pf-muted-copy" style={{ margin: "8px 0 12px", fontSize: 12, lineHeight: 1.5 }}>
        Copy contact details or open your email or phone app. PulseFill does not send messages from here yet.
      </p>
      {copyHint ? (
        <p className="pf-muted-copy" style={{ margin: "0 0 10px", fontSize: 12 }} aria-live="polite">
          {copyHint}
        </p>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {follow_up.can_email && follow_up.contact_email ? (
          <>
            <button type="button" onClick={() => void onCopyEmail()} style={btn}>
              Copy email
            </button>
            {mail ? (
              <MotionAction>
                <a href={mail} style={actionLinkStyle("secondary")}>
                  Email customer
                </a>
              </MotionAction>
            ) : null}
          </>
        ) : null}

        {follow_up.can_call && follow_up.contact_phone ? (
          <>
            <button type="button" onClick={() => void onCopyPhone()} style={btn}>
              Copy phone
            </button>
            {tel ? (
              <MotionAction>
                <a href={tel} style={actionLinkStyle("secondary")}>
                  Call customer
                </a>
              </MotionAction>
            ) : null}
          </>
        ) : null}

        {follow_up.suggested_action === "review_request" ? (
          <MotionAction>
            <Link href="/customers/standby-requests" style={actionLinkStyle("primary")}>
              Review standby request
            </Link>
          </MotionAction>
        ) : null}

        {follow_up.suggested_action === "invite_customer" ? (
          <MotionAction>
            <Link href="/customers#invite-customer" style={actionLinkStyle("primary")}>
              Invite customer
            </Link>
          </MotionAction>
        ) : null}

        <MotionAction>
          <Link href="/customers" style={actionLinkStyle("ghost")}>
            View standby coverage
          </Link>
        </MotionAction>
        <MotionAction>
          <Link href="/open-slots" style={actionLinkStyle("ghost")}>
            View openings
          </Link>
        </MotionAction>
        <MotionAction>
          <Link href="/activity" style={actionLinkStyle("ghost")}>
            Activity
          </Link>
        </MotionAction>
      </div>
    </section>
  );
}
