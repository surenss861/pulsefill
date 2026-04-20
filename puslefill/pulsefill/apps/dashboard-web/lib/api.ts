import { getStaffAccessToken } from "./auth";

export const LEGACY_STAFF_TOKEN_KEY = "pulsefill_staff_access_token";

export function hasLegacyStaffToken(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(LEGACY_STAFF_TOKEN_KEY));
}

function apiBase(): string {
  return process.env.NEXT_PUBLIC_PULSEFILL_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3001";
}

/** Prefer Supabase session token; fall back to legacy pasted JWT in localStorage or env (dev only). */
async function bearer(): Promise<string | null> {
  try {
    const fromSupabase = await getStaffAccessToken();
    if (fromSupabase) return fromSupabase;
  } catch {
    // Missing NEXT_PUBLIC_SUPABASE_* — allow legacy path only.
  }
  if (typeof window !== "undefined") {
    const legacy = window.localStorage.getItem(LEGACY_STAFF_TOKEN_KEY);
    if (legacy) return legacy;
  }
  return process.env.NEXT_PUBLIC_DEV_STAFF_ACCESS_TOKEN ?? null;
}

/** @deprecated Prefer Supabase sign-in; kept for migration / local debugging. */
export function setStaffAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(LEGACY_STAFF_TOKEN_KEY, token);
  else window.localStorage.removeItem(LEGACY_STAFF_TOKEN_KEY);
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${apiBase()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body != null) {
    headers.set("Content-Type", "application/json");
  }
  const token = await bearer();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers, cache: "no-store" });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    if (data && typeof data === "object" && data !== null && "error" in data) {
      const errField = (data as { error: unknown }).error;
      if (errField && typeof errField === "object" && errField !== null) {
        const nested = errField as { code?: string; message?: string; retryable?: boolean };
        const message = nested.message?.trim() || nested.code || `HTTP ${res.status}`;
        const e = new Error(message);
        (e as { code?: string; retryable?: boolean }).code = nested.code;
        (e as { retryable?: boolean }).retryable = nested.retryable;
        throw e;
      }
      if (typeof errField === "string") {
        throw new Error(errField);
      }
    }
    const msg = text || res.statusText;
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return data as T;
}
