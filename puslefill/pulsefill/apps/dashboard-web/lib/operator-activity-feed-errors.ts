import { isOperatorSessionError, operatorApiErrorUi } from "@/lib/operator-api-error-ui";

/** @deprecated Use isOperatorSessionError from operator-api-error-ui */
export function isActivityFeedAuthError(message: string): boolean {
  return isOperatorSessionError(message);
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
  const u = operatorApiErrorUi(raw);
  return {
    title: u.severity === "network" ? u.title : "Could not load activity",
    description: u.description,
    suggestSignIn: false,
  };
}
