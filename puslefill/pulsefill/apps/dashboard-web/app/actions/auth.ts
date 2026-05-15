"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { createClient, SupabaseConfigError } from "@/lib/supabase/server";

export type AuthFormState = {
  error?: string;
};

export type ResendState = {
  error?: string;
  ok?: boolean;
};

async function siteOrigin(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

function safeInternalPath(next: string, fallback: string): string {
  const t = next.trim() || fallback;
  return t.startsWith("/") && !t.startsWith("//") ? t : fallback;
}

type PulsefillAuthMe = {
  roles?: { customer?: boolean; staff?: boolean };
};

async function fetchPulsefillAuthMe(accessToken: string): Promise<PulsefillAuthMe | null> {
  const raw = process.env.NEXT_PUBLIC_PULSEFILL_API_URL?.trim();
  if (!raw) return null;
  const base = raw.replace(/\/$/, "");
  const res = await fetch(`${base}/v1/auth/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as PulsefillAuthMe;
}

export async function signOutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    /* still send people to sign-in if env is misconfigured */
  }
  redirect("/sign-in");
}

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeInternalPath(String(formData.get("next") ?? "/overview"), "/overview");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (token) {
      const hasApiUrl = Boolean(process.env.NEXT_PUBLIC_PULSEFILL_API_URL?.trim());
      if (hasApiUrl) {
        const me = await fetchPulsefillAuthMe(token);
        if (!me?.roles) {
          await supabase.auth.signOut();
          return { error: "Could not verify business access. Try again in a moment." };
        }
        if (!me.roles.staff) {
          await supabase.auth.signOut();
          return { error: "This account does not have business access." };
        }
      }
    }

    redirect(next);
  } catch (e) {
    if (isRedirectError(e)) throw e;
    if (e instanceof SupabaseConfigError) return { error: e.message };
    return { error: e instanceof Error ? e.message : "Could not sign in." };
  }
}

export async function sendMagicLinkAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };

  try {
    const supabase = await createClient();
    const origin = await siteOrigin();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/overview`,
      },
    });
    if (error) return { error: error.message };
    redirect(`/check-email?${new URLSearchParams({ email, flow: "magic" }).toString()}`);
  } catch (e) {
    if (isRedirectError(e)) throw e;
    if (e instanceof SupabaseConfigError) return { error: e.message };
    return { error: e instanceof Error ? e.message : "Could not send sign-in link." };
  }
}

export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!name) return { error: "Enter your full name." };
  if (!email) return { error: "Enter your email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords do not match." };

  try {
    const apiBase = process.env.NEXT_PUBLIC_PULSEFILL_API_URL?.trim();
    if (apiBase) {
      const res = await fetch(`${apiBase.replace(/\/$/, "")}/v1/dashboard/auth/sign-up-business`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: name }),
      });
      let json: unknown = {};
      try {
        json = await res.json();
      } catch {
        json = {};
      }
      if (!res.ok) {
        const err = json as { error?: { message?: string } };
        const msg = err.error?.message?.trim();
        return { error: msg && msg.length > 0 ? msg : "Could not create account." };
      }
      const body = json as { needs_email_confirmation?: boolean };
      if (body.needs_email_confirmation) {
        redirect(`/check-email?${new URLSearchParams({ email, flow: "signup" }).toString()}`);
      }
      redirect("/sign-in?signup=success");
    }

    const supabase = await createClient();
    const origin = await siteOrigin();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/overview`,
        data: { full_name: name, signup_intent: "business" },
      },
    });
    if (error) return { error: error.message };
    redirect(`/check-email?${new URLSearchParams({ email, flow: "signup" }).toString()}`);
  } catch (e) {
    if (isRedirectError(e)) throw e;
    if (e instanceof SupabaseConfigError) return { error: e.message };
    return { error: e instanceof Error ? e.message : "Could not create account." };
  }
}

export async function forgotPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };

  try {
    const supabase = await createClient();
    const origin = await siteOrigin();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });
    if (error) return { error: error.message };
    redirect(`/check-email?${new URLSearchParams({ email, flow: "recovery" }).toString()}`);
  } catch (e) {
    if (isRedirectError(e)) throw e;
    if (e instanceof SupabaseConfigError) return { error: e.message };
    return { error: e instanceof Error ? e.message : "Could not send reset link." };
  }
}

export async function resetPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords do not match." };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    redirect("/sign-in?reset=success");
  } catch (e) {
    if (isRedirectError(e)) throw e;
    if (e instanceof SupabaseConfigError) return { error: e.message };
    return { error: e instanceof Error ? e.message : "Could not update password." };
  }
}

export async function resendAuthEmailAction(_prev: ResendState, formData: FormData): Promise<ResendState> {
  const email = String(formData.get("email") ?? "").trim();
  const flow = String(formData.get("flow") ?? "");
  if (!email) return { error: "Missing email." };

  try {
    const supabase = await createClient();
    const origin = await siteOrigin();

    if (flow === "magic") {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${origin}/overview` },
      });
      if (error) return { error: error.message };
      return { ok: true };
    }

    if (flow === "recovery") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });
      if (error) return { error: error.message };
      return { ok: true };
    }

    return { error: "Unsupported flow." };
  } catch (e) {
    if (e instanceof SupabaseConfigError) return { error: e.message };
    return { error: e instanceof Error ? e.message : "Could not resend email." };
  }
}
