import type { FastifyBaseLogger } from "fastify";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Surfaces the product may route to (iOS tabs vs business shell). */
export type AuthAllowedSurface = "customer" | "business";

/** Backend-owned default route for the signed-in principal. */
export type AuthDefaultSurface = "customer" | "business" | "picker" | "none";

export type AuthMePayload = {
  user: {
    id: string;
    email: string | null | undefined;
    app_metadata: Record<string, unknown>;
    user_metadata: Record<string, unknown>;
  };
  roles: { customer: boolean; staff: boolean };
  customer: { id: string } | null;
  staff: { businesses: AuthMeBusiness[] } | null;
  allowed_surfaces: AuthAllowedSurface[];
  default_surface: AuthDefaultSurface;
};

export type AuthMeBusiness = {
  business_id: string;
  business_name: string;
  role: string;
};

/**
 * Maps customer/staff capabilities to routing fields (single source of truth for clients).
 */
export function deriveAuthSurfaces(roles: { customer: boolean; staff: boolean }): {
  allowed_surfaces: AuthAllowedSurface[];
  default_surface: AuthDefaultSurface;
} {
  const { customer: c, staff: s } = roles;
  if (c && !s) {
    return { allowed_surfaces: ["customer"], default_surface: "customer" };
  }
  if (!c && s) {
    return { allowed_surfaces: ["business"], default_surface: "business" };
  }
  if (c && s) {
    return { allowed_surfaces: ["customer", "business"], default_surface: "picker" };
  }
  return { allowed_surfaces: [], default_surface: "none" };
}

/**
 * Shared customer + staff role resolution used by `GET /v1/auth/me` and mobile auth broker responses.
 */
export async function buildAuthMePayload(
  admin: SupabaseClient,
  authUser: {
    id: string;
    email?: string | null;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  },
  log?: FastifyBaseLogger,
): Promise<AuthMePayload> {
  const uid = authUser.id;

  const [customerRes, staffRes] = await Promise.all([
    admin.from("customers").select("id").eq("auth_user_id", uid).maybeSingle(),
    admin
      .from("staff_users")
      .select("business_id, role, businesses ( id, name )")
      .eq("auth_user_id", uid),
  ]);

  if (customerRes.error) {
    log?.warn({ err: customerRes.error }, "auth_me_customer_lookup_degraded");
  }
  if (staffRes.error) {
    log?.warn({ err: staffRes.error }, "auth_me_staff_lookup_degraded");
  }

  const customerId = customerRes.error ? null : (customerRes.data?.id ?? null);
  const staffRows = staffRes.error || !staffRes.data ? [] : staffRes.data;
  const businesses: AuthMeBusiness[] = staffRows.map((row: Record<string, unknown>) => {
    const rel = row.businesses as { id?: string; name?: string } | { id?: string; name?: string }[] | null;
    const b = Array.isArray(rel) ? rel[0] : rel;
    return {
      business_id: String(row.business_id ?? ""),
      business_name: b?.name ? String(b.name) : "Business",
      role: String(row.role ?? "staff"),
    };
  });

  const hasCustomer = Boolean(customerId);
  const hasStaff = businesses.length > 0;

  const roles = { customer: hasCustomer, staff: hasStaff };
  const { allowed_surfaces, default_surface } = deriveAuthSurfaces(roles);

  return {
    user: {
      id: authUser.id,
      email: authUser.email,
      app_metadata: (authUser.app_metadata ?? {}) as Record<string, unknown>,
      user_metadata: (authUser.user_metadata ?? {}) as Record<string, unknown>,
    },
    roles,
    customer: customerId ? { id: customerId } : null,
    staff: hasStaff ? { businesses } : null,
    allowed_surfaces,
    default_surface,
  };
}
