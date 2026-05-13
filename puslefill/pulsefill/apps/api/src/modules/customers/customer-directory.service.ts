import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { sendJson } from "../../lib/http-errors.js";
import { normalizeEmailForInvite } from "./invite-token.js";
import {
  getCustomerBusinessRelationship,
  nextStepFromRelationship,
  standbyIntentPayload,
} from "./customer-business-relationship.js";
import { upsertActiveCustomerMembership } from "./membership.js";

/** Safe public copy for directory detail (no PII); businesses may customize later via DB. */
export const DIRECTORY_PUBLIC_BLURB =
  "Join the waiting list. When an opening appears, PulseFill will send you an offer.";

function trimNonEmpty(s: string | null | undefined): string | null {
  const t = s?.trim();
  return t && t.length > 0 ? t : null;
}

/** Pure mapping for customer directory list/detail — `businesses.name` stays internal; API returns resolved display strings. */
export function resolveDirectoryDisplayFields(input: {
  name: string;
  category: string | null;
  public_display_name: string | null;
  public_description: string | null;
  public_category: string | null;
  public_city: string | null;
  public_neighborhood: string | null;
  public_website: string | null;
  public_phone: string | null;
  public_logo_url: string | null;
  public_cover_image_url: string | null;
  public_join_note: string | null;
  fallbackLocation?: { name: string; city: string | null } | null;
  fallbackBlurb: string;
}): {
  name: string;
  category: string | null;
  city: string | null;
  neighborhood: string | null;
  description: string;
  website: string | null;
  phone: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  join_note: string | null;
} {
  const loc = input.fallbackLocation;
  return {
    name: trimNonEmpty(input.public_display_name) ?? input.name,
    category: trimNonEmpty(input.public_category) ?? input.category ?? null,
    city: trimNonEmpty(input.public_city) ?? loc?.city ?? null,
    neighborhood: trimNonEmpty(input.public_neighborhood) ?? loc?.name ?? null,
    description: trimNonEmpty(input.public_description) ?? input.fallbackBlurb,
    website: trimNonEmpty(input.public_website),
    phone: trimNonEmpty(input.public_phone),
    logo_url: trimNonEmpty(input.public_logo_url),
    cover_image_url: trimNonEmpty(input.public_cover_image_url),
    join_note: trimNonEmpty(input.public_join_note),
  };
}

export async function ensureCustomerRow(admin: SupabaseClient, u: User): Promise<{ id: string }> {
  const row = {
    auth_user_id: u.id,
    email: u.email != null ? normalizeEmailForInvite(u.email) : null,
    full_name: (u.user_metadata?.full_name as string | undefined) ?? null,
  };
  const { data, error } = await admin.from("customers").upsert(row, { onConflict: "auth_user_id" }).select("id").single();
  if (error || !data) {
    throw new Error("customer_upsert_failed");
  }
  return { id: (data as { id: string }).id };
}

type RelationshipListSlice = {
  membership_status: "none" | "active";
  request_status: "none" | "pending" | "declined";
};

async function batchDirectoryRelationships(
  admin: SupabaseClient,
  customerId: string,
  businessIds: string[],
): Promise<Map<string, RelationshipListSlice>> {
  const out = new Map<string, RelationshipListSlice>();
  if (businessIds.length === 0) return out;

  const { data: memRows } = await admin
    .from("customer_business_memberships")
    .select("business_id")
    .eq("customer_id", customerId)
    .eq("status", "active")
    .in("business_id", businessIds);

  const activeSet = new Set((memRows ?? []).map((r: { business_id: string }) => r.business_id));

  const { data: allReqs } = await admin
    .from("customer_standby_requests")
    .select("business_id, status, requested_at")
    .eq("customer_id", customerId)
    .in("business_id", businessIds)
    .order("requested_at", { ascending: false });

  const latestStatusByBiz = new Map<string, string>();
  for (const r of allReqs ?? []) {
    const row = r as { business_id: string; status: string };
    if (!latestStatusByBiz.has(row.business_id)) {
      latestStatusByBiz.set(row.business_id, row.status);
    }
  }

  for (const bid of businessIds) {
    if (activeSet.has(bid)) {
      out.set(bid, { membership_status: "active", request_status: "none" });
      continue;
    }
    const latest = latestStatusByBiz.get(bid);
    if (latest === "pending") {
      out.set(bid, { membership_status: "none", request_status: "pending" });
    } else if (latest === "declined") {
      out.set(bid, { membership_status: "none", request_status: "declined" });
    } else {
      out.set(bid, { membership_status: "none", request_status: "none" });
    }
  }
  return out;
}

export async function buildDirectoryListPayload(admin: SupabaseClient, customerId: string) {
  const { data: businesses, error } = await admin
    .from("businesses")
    .select(
      "id, name, slug, category, timezone, standby_access_mode, customer_discovery_enabled, public_display_name, public_description, public_category, public_city, public_neighborhood, public_website, public_phone, public_logo_url, public_cover_image_url, public_join_note",
    )
    .eq("customer_discovery_enabled", true)
    .order("name", { ascending: true })
    .limit(100);

  if (error) {
    throw new Error("directory_list_failed");
  }

  const rows = (businesses ?? []) as unknown as Array<{
    id: string;
    name: string;
    slug: string;
    category: string | null;
    timezone: string;
    standby_access_mode: string;
    customer_discovery_enabled: boolean;
    public_display_name: string | null;
    public_description: string | null;
    public_category: string | null;
    public_city: string | null;
    public_neighborhood: string | null;
    public_website: string | null;
    public_phone: string | null;
    public_logo_url: string | null;
    public_cover_image_url: string | null;
    public_join_note: string | null;
  }>;

  const ids = rows.map((r) => r.id);
  const [relMap, locRows, svcRows] = await Promise.all([
    batchDirectoryRelationships(admin, customerId, ids),
    ids.length
      ? admin.from("locations").select("business_id, name, city, region").in("business_id", ids).order("name", { ascending: true })
      : Promise.resolve({ data: [] as unknown[] }),
    ids.length
      ? admin.from("services").select("business_id, name").eq("active", true).in("business_id", ids).order("name", { ascending: true })
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  const firstLocByBiz = new Map<string, { name: string; city: string | null }>();
  for (const r of (locRows as { data: unknown[] }).data ?? []) {
    const row = r as { business_id: string; name: string; city: string | null };
    if (!firstLocByBiz.has(row.business_id)) {
      firstLocByBiz.set(row.business_id, { name: row.name, city: row.city ?? null });
    }
  }

  const servicesByBiz = new Map<string, string[]>();
  for (const r of (svcRows as { data: unknown[] }).data ?? []) {
    const row = r as { business_id: string; name: string };
    const arr = servicesByBiz.get(row.business_id) ?? [];
    if (arr.length < 8) {
      arr.push(row.name);
      servicesByBiz.set(row.business_id, arr);
    }
  }

  return {
    businesses: rows.map((b) => {
      const loc = firstLocByBiz.get(b.id);
      const pub = resolveDirectoryDisplayFields({
        name: b.name,
        category: b.category,
        public_display_name: b.public_display_name,
        public_description: b.public_description,
        public_category: b.public_category,
        public_city: b.public_city,
        public_neighborhood: b.public_neighborhood,
        public_website: b.public_website,
        public_phone: b.public_phone,
        public_logo_url: b.public_logo_url,
        public_cover_image_url: b.public_cover_image_url,
        public_join_note: b.public_join_note,
        fallbackLocation: loc ? { name: loc.name, city: loc.city } : null,
        fallbackBlurb: DIRECTORY_PUBLIC_BLURB,
      });
      return {
        id: b.id,
        name: pub.name,
        slug: b.slug,
        category: pub.category,
        timezone: b.timezone,
        standby_access_mode: b.standby_access_mode,
        customer_discovery_enabled: b.customer_discovery_enabled,
        city: pub.city,
        neighborhood: pub.neighborhood,
        description: pub.description,
        website: pub.website,
        phone: pub.phone,
        logo_url: pub.logo_url,
        cover_image_url: pub.cover_image_url,
        join_note: pub.join_note,
        services: servicesByBiz.get(b.id) ?? [],
        relationship: relMap.get(b.id) ?? { membership_status: "none" as const, request_status: "none" as const },
      };
    }),
  };
}

export async function buildDirectoryDetailPayload(admin: SupabaseClient, customerId: string, businessId: string) {
  const { data: b, error: bErr } = await admin
    .from("businesses")
    .select(
      "id, name, slug, category, timezone, standby_access_mode, customer_discovery_enabled, public_display_name, public_description, public_category, public_city, public_neighborhood, public_website, public_phone, public_logo_url, public_cover_image_url, public_join_note",
    )
    .eq("id", businessId)
    .maybeSingle();

  if (bErr || !b) {
    return { kind: "not_found" as const };
  }
  const biz = b as unknown as {
    id: string;
    name: string;
    slug: string;
    category: string | null;
    timezone: string;
    standby_access_mode: string;
    customer_discovery_enabled: boolean;
    public_display_name: string | null;
    public_description: string | null;
    public_category: string | null;
    public_city: string | null;
    public_neighborhood: string | null;
    public_website: string | null;
    public_phone: string | null;
    public_logo_url: string | null;
    public_cover_image_url: string | null;
    public_join_note: string | null;
  };
  if (!biz.customer_discovery_enabled) {
    return { kind: "not_found" as const };
  }

  const [{ data: locations }, { data: services }, rel] = await Promise.all([
    admin.from("locations").select("id, name, city, region").eq("business_id", businessId).order("name", { ascending: true }),
    admin.from("services").select("id, name, duration_minutes, active").eq("business_id", businessId).eq("active", true).order("name"),
    getCustomerBusinessRelationship(admin, customerId, businessId),
  ]);

  const locs = (locations ?? []) as Array<{ id: string; name: string; city: string | null; region: string | null }>;
  const primary = locs[0];
  const nextStep = nextStepFromRelationship(rel);
  const pub = resolveDirectoryDisplayFields({
    name: biz.name,
    category: biz.category,
    public_display_name: biz.public_display_name,
    public_description: biz.public_description,
    public_category: biz.public_category,
    public_city: biz.public_city,
    public_neighborhood: biz.public_neighborhood,
    public_website: biz.public_website,
    public_phone: biz.public_phone,
    public_logo_url: biz.public_logo_url,
    public_cover_image_url: biz.public_cover_image_url,
    public_join_note: biz.public_join_note,
    fallbackLocation: primary ? { name: primary.name, city: primary.city } : null,
    fallbackBlurb: DIRECTORY_PUBLIC_BLURB,
  });

  return {
    kind: "ok" as const,
    body: {
      business: {
        id: biz.id,
        name: pub.name,
        slug: biz.slug,
        category: pub.category,
        timezone: biz.timezone,
        standby_access_mode: biz.standby_access_mode,
        customer_discovery_enabled: biz.customer_discovery_enabled,
        city: pub.city,
        neighborhood: pub.neighborhood,
        description: pub.description,
        website: pub.website,
        phone: pub.phone,
        logo_url: pub.logo_url,
        cover_image_url: pub.cover_image_url,
        join_note: pub.join_note,
        services: (services ?? []) as Array<{ id: string; name: string; duration_minutes: number; active: boolean }>,
        locations: locs,
        relationship: {
          membership_status: rel.membership_status,
          request_status: rel.request_status,
          standby_status: rel.standby_status,
          next_step: nextStep,
        },
      },
    },
  };
}

const standbyIntentBody = z
  .object({
    message: z.string().max(500).optional(),
  })
  .strict();

export async function executeStandbyIntent(
  req: FastifyRequest,
  reply: FastifyReply,
  businessId: string,
  bodyRaw: unknown,
) {
  const body = standbyIntentBody.parse(bodyRaw ?? {});
  const admin = createServiceSupabase(req.server.env);
  const u = req.authUser!;

  let customerId: string;
  try {
    customerId = (await ensureCustomerRow(admin, u)).id;
  } catch {
    return sendJson(req, reply, 500, { error: "customer_sync_failed" });
  }

  const { data: b, error: bErr } = await admin
    .from("businesses")
    .select("id, standby_access_mode, customer_discovery_enabled")
    .eq("id", businessId)
    .maybeSingle();

  if (bErr || !b) {
    return sendJson(req, reply, 404, { error: "not_found" });
  }
  const row = b as { id: string; standby_access_mode: string; customer_discovery_enabled: boolean };
  if (!row.customer_discovery_enabled) {
    return sendJson(req, reply, 404, { error: "not_found" });
  }

  const { data: existing } = await admin
    .from("customer_business_memberships")
    .select("id, status")
    .eq("customer_id", customerId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (existing && (existing as { status: string }).status === "active") {
    const rel = await getCustomerBusinessRelationship(admin, customerId, businessId);
    return reply.send({
      ...standbyIntentPayload(rel, "joined", "already_connected"),
      request: null,
    });
  }

  if (row.standby_access_mode === "private") {
    const rel = await getCustomerBusinessRelationship(admin, customerId, businessId);
    return sendJson(req, reply, 403, {
      error: "private_business",
      message: "This business only connects customers through an invite from the clinic.",
      ...standbyIntentPayload(rel, "invite_required", "invite_required"),
    });
  }

  if (row.standby_access_mode === "public") {
    try {
      await upsertActiveCustomerMembership(admin, customerId, businessId, "public");
    } catch (e) {
      req.log.error({ e }, "public membership upsert");
      return sendJson(req, reply, 500, { error: "membership_failed" });
    }
    const rel = await getCustomerBusinessRelationship(admin, customerId, businessId);
    return reply.status(201).send({
      ...standbyIntentPayload(rel, "joined", "joined_standby"),
      request: null,
    });
  }

  const { data: inserted, error: insErr } = await admin
    .from("customer_standby_requests")
    .insert({
      business_id: businessId,
      customer_id: customerId,
      status: "pending",
      message: body.message ?? null,
    })
    .select("id, status, requested_at")
    .maybeSingle();

  if (insErr) {
    const code = String((insErr as { code?: string }).code ?? "");
    if (code === "23505") {
      const rel = await getCustomerBusinessRelationship(admin, customerId, businessId);
      return reply.send({
        ...standbyIntentPayload(rel, "request_pending", "request_pending"),
        request: null,
      });
    }
    req.log.error({ error: insErr }, "standby request insert");
    return sendJson(req, reply, 500, { error: "request_failed" });
  }

  const rel = await getCustomerBusinessRelationship(admin, customerId, businessId);
  return reply.status(201).send({
    ...standbyIntentPayload(rel, "request_pending", "request_submitted"),
    request: inserted,
  });
}
