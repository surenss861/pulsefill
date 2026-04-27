"use server";

import { redirect } from "next/navigation";
import {
  authFormErrorFromUnknown,
  isNextRedirectError,
  userFacingSupabaseMessage,
} from "@/lib/auth-action-errors";
import { getAuthEnvSnapshot } from "@/lib/auth-env-snapshot";
import { createClient } from "@/lib/supabase/server";
import { safeUrlParts } from "@/lib/supabase/project-url";
import { getSiteUrl } from "@/lib/site-url";

export type AuthFormState = { error?: string };

const callbackUrl = (next: string) =>
  `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next.startsWith("/") ? next : `/${next}`)}`;

export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const fullName = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!fullName || !email || !password || !confirmPassword) {
    return { error: "Fill in all required fields." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  try {
    const emailRedirectTo = callbackUrl("/overview");
    let emailRedirectValid = false;
    try {
      new URL(emailRedirectTo);
      emailRedirectValid = true;
    } catch {
      /* invalid absolute URL — still attempt sign-up; logs will show the bad value */
    }

    if (process.env.AUTH_ENV_DEBUG === "1") {
      console.log(
        "[sign-up env check]",
        getAuthEnvSnapshot({
          emailRedirectTo: safeUrlParts(emailRedirectTo),
          emailRedirectToRaw: emailRedirectTo.slice(0, 500),
          emailRedirectValid,
        }),
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo,
      },
    });

    if (error) {
      console.error("[sign-up redirect]", {
        emailRedirectTo,
        siteUrl: getSiteUrl(),
        emailRedirectValid,
      });
      console.error("[auth] sign-up failed", {
        message: error.message,
        code: error.code,
        status: error.status,
        emailRedirectTo,
        siteUrl: getSiteUrl(),
        supabaseUrl: safeUrlParts(process.env.NEXT_PUBLIC_SUPABASE_URL),
      });
      return {
        error: userFacingSupabaseMessage(
          error.message,
          "We couldn't create your workspace. Please try again.",
        ),
      };
    }

    redirect(`/check-email?email=${encodeURIComponent(email)}&flow=signup`);
  } catch (e) {
    return authFormErrorFromUnknown("sign-up", e);
  }
}

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "/overview").trim();
  const next =
    nextRaw.startsWith("/") && !nextRaw.startsWith("//") && !nextRaw.includes("://") ? nextRaw : "/overview";

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: "Invalid email or password." };
    }

    redirect(next);
  } catch (e) {
    return authFormErrorFromUnknown("sign-in", e);
  }
}

export async function sendMagicLinkAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Enter your work email." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl("/overview"),
      },
    });

    if (error) {
      console.error("[auth] magic-link failed", {
        message: error.message,
        code: error.code,
        status: error.status,
      });
      return {
        error: userFacingSupabaseMessage(
          error.message,
          "We couldn't send the sign-in link. Please try again.",
        ),
      };
    }

    redirect(`/check-email?email=${encodeURIComponent(email)}&flow=magic`);
  } catch (e) {
    return authFormErrorFromUnknown("magic-link", e);
  }
}

export async function forgotPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Enter your email address." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: callbackUrl("/reset-password"),
    });

    if (error) {
      console.error("[auth] forgot-password failed", {
        message: error.message,
        code: error.code,
        status: error.status,
      });
      return {
        error: userFacingSupabaseMessage(
          error.message,
          "We couldn't send the reset email. Please try again.",
        ),
      };
    }

    redirect(`/check-email?email=${encodeURIComponent(email)}&flow=recovery`);
  } catch (e) {
    return authFormErrorFromUnknown("forgot-password", e);
  }
}

export async function resetPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || !confirmPassword) {
    return { error: "Fill in both password fields." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error("[auth] reset-password failed", {
        message: error.message,
        code: error.code,
        status: error.status,
      });
      return {
        error: userFacingSupabaseMessage(
          error.message,
          "We couldn't update your password. Please try again.",
        ),
      };
    }

    redirect("/sign-in?reset=success");
  } catch (e) {
    return authFormErrorFromUnknown("reset-password", e);
  }
}

export type ResendState = { error?: string; ok?: boolean };

export async function resendAuthEmailAction(_prev: ResendState, formData: FormData): Promise<ResendState> {
  const email = String(formData.get("email") ?? "").trim();
  const flow = String(formData.get("flow") ?? "");

  if (!email) {
    return { error: "Missing email." };
  }

  try {
    const supabase = await createClient();

    if (flow === "magic") {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl("/overview") },
      });
      if (error) {
        console.error("[auth] resend magic failed", {
          message: error.message,
          code: error.code,
          status: error.status,
        });
        return {
          error: userFacingSupabaseMessage(
            error.message,
            "We couldn't send the sign-in link. Please try again.",
          ),
        };
      }
      return { ok: true };
    }

    if (flow === "recovery") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callbackUrl("/reset-password"),
      });
      if (error) {
        console.error("[auth] resend recovery failed", {
          message: error.message,
          code: error.code,
          status: error.status,
        });
        return {
          error: userFacingSupabaseMessage(
            error.message,
            "We couldn't send the reset email. Please try again.",
          ),
        };
      }
      return { ok: true };
    }

    return { error: "Unsupported flow." };
  } catch (e) {
    return authFormErrorFromUnknown("resend-email", e);
  }
}

export async function signOutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    console.error("[auth] sign-out failed (session may already be cleared)", e);
  }
  redirect("/sign-in");
}
