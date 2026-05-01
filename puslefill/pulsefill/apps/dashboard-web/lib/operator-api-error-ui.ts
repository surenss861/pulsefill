/** Friendly copy for operator dashboard load failures (lists, forms, feeds). */

export type OperatorApiErrorSeverity = "auth" | "network" | "data";

export type OperatorApiErrorUi = {
  severity: OperatorApiErrorSeverity;
  title: string;
  description: string;
  /** True when the operator should re-authenticate. */
  showSignIn: boolean;
};

export function isOperatorSessionError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("unauthorized") ||
    m.includes("401") ||
    m.includes("forbidden") ||
    m.includes("403") ||
    m.includes("not authenticated") ||
    m.includes("invalid token") ||
    m.includes("jwt expired") ||
    m.includes("session expired")
  );
}

function isLikelyNetworkError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("network request failed") ||
    m.includes("load failed") ||
    m.includes("econnrefused")
  );
}

/** Map API/load error strings to calm operator-facing copy. */
export function operatorApiErrorUi(raw: string): OperatorApiErrorUi {
  const t = raw.trim();
  if (!t) {
    return {
      severity: "data",
      title: "Something went wrong",
      description: "Try again in a moment.",
      showSignIn: false,
    };
  }
  if (isOperatorSessionError(t)) {
    return {
      severity: "auth",
      title: "Session needs refresh",
      description: "Sign in again to keep working in this recovery workspace.",
      showSignIn: true,
    };
  }
  if (isLikelyNetworkError(t)) {
    return {
      severity: "network",
      title: "Couldn’t reach PulseFill",
      description: "Check your connection and try again.",
      showSignIn: false,
    };
  }
  return {
    severity: "data",
    title: "We couldn’t load this area",
    description: t.length <= 160 ? t : `${t.slice(0, 157)}…`,
    showSignIn: false,
  };
}
