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
    const supabase = await createClient();
    const origin = await siteOrigin();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/overview`,
        data: { full_name: name },
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
