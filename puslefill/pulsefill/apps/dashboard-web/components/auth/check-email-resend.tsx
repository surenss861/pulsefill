"use client";

import { useActionState } from "react";
import { resendAuthEmailAction, type ResendState } from "@/app/actions/auth";

const initial: ResendState = {};

export function CheckEmailResend({ email, flow }: { email: string; flow: string }) {
  const [state, formAction] = useActionState(resendAuthEmailAction, initial);

  if (flow !== "magic" && flow !== "recovery") {
    return null;
  }

  return (
    <form action={formAction} style={{ marginTop: 12 }}>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="flow" value={flow} />
      <button
        type="submit"
        style={{
          border: "none",
          background: "none",
          padding: 0,
          fontSize: 14,
          fontWeight: 600,
          color: "var(--pf-btn-link-text)",
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        Resend email
      </button>
      {state.error ? (
        <p style={{ margin: "10px 0 0", fontSize: 13, color: "#fca5a5" }}>{state.error}</p>
      ) : null}
      {state.ok ? (
        <p style={{ margin: "10px 0 0", fontSize: 13, color: "rgba(167, 243, 208, 0.95)" }}>Sent again.</p>
      ) : null}
    </form>
  );
}
