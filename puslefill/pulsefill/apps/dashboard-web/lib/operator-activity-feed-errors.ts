/** Normalize activity API errors for operator UI (avoid raw "unauthorized" in dashboards). */

export function isActivityFeedAuthError(message: string): boolean {
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

export type ActivityFeedErrorUi = {
  title: string;
  description: string;
  /** Offer sign-in when session / token is the likely issue. */
  suggestSignIn: boolean;
};

export function activityFeedErrorUi(raw: string): ActivityFeedErrorUi {
  if (isActivityFeedAuthError(raw)) {
    return {
      title: "Activity unavailable",
      description:
        "We could not load recent events—usually this means your session expired. Try refreshing the page, or sign in again.",
      suggestSignIn: true,
    };
  }
  return {
    title: "Could not load activity",
    description: raw,
    suggestSignIn: false,
  };
}
