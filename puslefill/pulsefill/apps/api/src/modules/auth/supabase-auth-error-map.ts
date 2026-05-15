/** Maps Supabase Auth errors to broker-style HTTP responses (mobile + dashboard auth routes). */
export function mapSupabaseAuthFailure(err: { message?: string; status?: number; code?: string }): {
  status: number;
  code: string;
  message: string;
  retryable: boolean;
} {
  const code = (err.code ?? "").toLowerCase();
  const msg = (err.message ?? "").toLowerCase();
  const status = err.status ?? 400;

  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) {
    return {
      status: 401,
      code: "EMAIL_NOT_CONFIRMED",
      message: "Check your email to verify your account.",
      retryable: false,
    };
  }
  if (
    code === "invalid_credentials" ||
    code === "invalid_grant" ||
    msg.includes("invalid login credentials") ||
    msg.includes("invalid password")
  ) {
    return {
      status: 401,
      code: "INVALID_CREDENTIALS",
      message: "Email or password is incorrect.",
      retryable: false,
    };
  }
  if (code === "user_already_registered" || msg.includes("user already registered")) {
    return {
      status: 409,
      code: "USER_ALREADY_EXISTS",
      message: "An account with this email already exists.",
      retryable: false,
    };
  }
  if (status === 429 || code === "over_request_rate_limit" || msg.includes("rate limit")) {
    return {
      status: 429,
      code: "RATE_LIMITED",
      message: "Too many attempts. Try again shortly.",
      retryable: true,
    };
  }
  if (status === 401) {
    return {
      status: 401,
      code: "INVALID_CREDENTIALS",
      message: "Email or password is incorrect.",
      retryable: false,
    };
  }
  return {
    status: 502,
    code: "AUTH_PROVIDER_ERROR",
    message: "PulseFill could not reach the identity service. Try again shortly.",
    retryable: true,
  };
}
