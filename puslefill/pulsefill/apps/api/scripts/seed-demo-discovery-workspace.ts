/**
 * Repeatable staging/demo seed for discovery + waitlist QA (six businesses, stable slugs,
 * stable customer emails, memberships, standby requests, preferences).
 *
 * Run from repo root:
 *   pnpm seed:demo-discovery
 * From apps/api:
 *   pnpm seed:demo-discovery
 *
 * Required env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   DEMO_STAFF_AUTH_USER_ID — auth.users UUID for the operator who should own every demo
 *     business (Business iOS sign-in).
 *
 * Safety (same posture as seed-demo-workspace):
 *   Refuses non-local Supabase unless PULSEFILL_ALLOW_CUSTOMER_FLOW_SEED=1.
 *   Refuses NODE_ENV=production unless DEMO_SEED_ALLOW_PRODUCTION=true.
 *
 * Idempotent: upserts businesses by fixed slugs, ensures auth customers by fixed emails,
 * then clears demo-scoped memberships / requests / prefs for those customers on those
 * businesses and reapplies the matrix.
 *
 * Requires DB migration `0025_public_discovery_profile.sql` (and prior migrations) so
 * `businesses.public_*` columns exist.
 *
 * standby_access_mode: `public` = instant join; `private` = invite-only; any other value
 * (this script uses `request`) = request-to-join + staff approval (matches API routing).
 */
import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

/** Third mode: waitlist / staff approval (not `public` or `private`). */
const STANDBY_WAITLIST = "request" as const;

const DEMO_PASSWORD = "Pulsefill-Demo-2026-Aa!";

const STAFF_EMAIL = "demo-discovery.operator@pulsefill.invalid";

const DEMO_CUSTOMER_EMAILS = [
  "demo-customer-new@pulsefill.test",
  "demo-customer-pending@pulsefill.test",
  "demo-customer-joined@pulsefill.test",
  "demo-customer-declined@pulsefill.test",
  "demo-customer-pref-missing@pulsefill.test",
  "demo-waitlist-a@pulsefill.test",
  "demo-waitlist-b@pulsefill.test",
] as const;

type DemoBizSlug =
  | "demo-discovery-yorkville-wellness"
  | "demo-discovery-queen-west-studio"
  | "demo-discovery-midtown-physio"
  | "demo-discovery-north-toronto-dental"
  | "demo-discovery-king-west-skin-clinic"
  | "demo-discovery-liberty-village-massage";

type DemoBusinessSeed = {
  slug: DemoBizSlug;
  /** Internal `businesses.name` (legal / ops). */
  internalName: string;
  category: string | null;
  customer_discovery_enabled: boolean;
  standby_access_mode: "private" | "public" | typeof STANDBY_WAITLIST;
  /** Optional public_* overrides (null = leave unset for fallback QA). */
  public?: {
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
};

const BUSINESSES: DemoBusinessSeed[] = [
  {
    slug: "demo-discovery-yorkville-wellness",
    internalName: "Yorkville Wellness Demo Inc.",
    category: "Wellness",
    customer_discovery_enabled: true,
    standby_access_mode: STANDBY_WAITLIST,
    public: {
      public_display_name: "Yorkville Wellness",
      public_description: null,
      public_category: null,
      public_city: "Toronto",
      public_neighborhood: "Yorkville",
      public_website: null,
      public_phone: null,
      public_logo_url: null,
      public_cover_image_url: null,
      public_join_note: "Waitlist-first — staff approves new customers.",
    },
  },
  {
    slug: "demo-discovery-queen-west-studio",
    internalName: "Queen West Studio Demo Inc.",
    category: "Salon",
    customer_discovery_enabled: true,
    standby_access_mode: STANDBY_WAITLIST,
    public: {
      public_display_name: "Queen West Studio",
      public_description: null,
      public_category: null,
      public_city: "Toronto",
      public_neighborhood: "Queen West",
      public_website: null,
      public_phone: null,
      public_logo_url: null,
      public_cover_image_url: null,
      public_join_note: null,
    },
  },
  {
    slug: "demo-discovery-midtown-physio",
    internalName: "Midtown Physio Demo Inc.",
    category: "Physio",
    customer_discovery_enabled: true,
    standby_access_mode: STANDBY_WAITLIST,
    public: {
      public_display_name: "Midtown Physio",
      public_description: null,
      public_category: null,
      public_city: "Toronto",
      public_neighborhood: "Midtown",
      public_website: null,
      public_phone: null,
      public_logo_url: null,
      public_cover_image_url: null,
      public_join_note: "Use this row to verify “request pending” in Find.",
    },
  },
  {
    slug: "demo-discovery-north-toronto-dental",
    internalName: "North Toronto Dental Demo Inc.",
    category: "Dental",
    customer_discovery_enabled: false,
    standby_access_mode: "private",
    public: {
      public_display_name: "North Toronto Dental",
      public_description: "Invite-only practice (not in public directory).",
      public_category: "Dental",
      public_city: "Toronto",
      public_neighborhood: "North Toronto",
      public_website: null,
      public_phone: null,
      public_logo_url: null,
      public_cover_image_url: null,
      public_join_note: null,
    },
  },
  {
    slug: "demo-discovery-king-west-skin-clinic",
    internalName: "King West Skin Clinic",
    category: "Dermatology",
    customer_discovery_enabled: true,
    standby_access_mode: STANDBY_WAITLIST,
    public: {
      public_display_name: null,
      public_description: null,
      public_category: null,
      public_city: null,
      public_neighborhood: null,
      public_website: null,
      public_phone: null,
      public_logo_url: null,
      public_cover_image_url: null,
      public_join_note: null,
    },
  },
  {
    slug: "demo-discovery-liberty-village-massage",
    internalName: "Liberty Village Massage Demo Inc.",
    category: "Massage",
    customer_discovery_enabled: true,
    standby_access_mode: STANDBY_WAITLIST,
    public: {
      public_display_name: "Liberty Village Massage",
      public_description:
        "Registered massage therapy with same-day openings when available. Book online or join the PulseFill waitlist.",
      public_category: "Registered massage therapy",
      public_city: "Toronto",
      public_neighborhood: "Liberty Village",
      public_website: "https://example.com/liberty-village-massage",
      public_phone: "+1 416-555-0199",
      public_logo_url: "https://picsum.photos/seed/pulsefill-liberty-logo/256/256",
      public_cover_image_url: "https://picsum.photos/seed/pulsefill-liberty-cover/1200/600",
      public_join_note: "Evening appointments released mid-week.",
    },
  },
];

function assertSafeToRun(supabaseUrl: string) {
  if (process.env.NODE_ENV === "production" && process.env.DEMO_SEED_ALLOW_PRODUCTION !== "true") {
    console.error("Refusing discovery demo seed: NODE_ENV=production. Set DEMO_SEED_ALLOW_PRODUCTION=true to override.");
    process.exit(1);
  }
  const allow = process.env.PULSEFILL_ALLOW_CUSTOMER_FLOW_SEED === "1";
  const local =
    supabaseUrl.includes("127.0.0.1") ||
    supabaseUrl.includes("localhost") ||
    /54321/.test(supabaseUrl);
  if (!local && !allow) {
    console.error(
      "Refusing discovery demo seed: Supabase URL does not look local. Set PULSEFILL_ALLOW_CUSTOMER_FLOW_SEED=1 for shared/staging.",
    );
    process.exit(1);
  }
}

async function ensureStaff(admin: SupabaseClient, businessId: string, staffAuthUserId: string): Promise<string> {
  const { data: existing, error: selErr } = await admin
    .from("staff_users")
    .select("id")
    .eq("business_id", businessId)
    .eq("auth_user_id", staffAuthUserId)
    .maybeSingle();
  if (selErr) throw new Error(selErr.message);
  if (existing?.id) return existing.id as string;

  const { data: row, error } = await admin
    .from("staff_users")
    .insert({
      business_id: businessId,
      auth_user_id: staffAuthUserId,
      role: "owner",
      full_name: "Discovery Demo Operator",
      email: STAFF_EMAIL,
    })
    .select("id")
    .single();
  if (error || !row) throw new Error(error?.message ?? "staff_users insert failed");
  return row.id as string;
}

async function ensureBusiness(admin: SupabaseClient, def: DemoBusinessSeed): Promise<string> {
  const pub = def.public;
  const row = {
    name: def.internalName,
    slug: def.slug,
    timezone: "America/Toronto",
    category: def.category,
    standby_access_mode: def.standby_access_mode,
    customer_discovery_enabled: def.customer_discovery_enabled,
    ...(pub
      ? {
          public_display_name: pub.public_display_name,
          public_description: pub.public_description,
          public_category: pub.public_category,
          public_city: pub.public_city,
          public_neighborhood: pub.public_neighborhood,
          public_website: pub.public_website,
          public_phone: pub.public_phone,
          public_logo_url: pub.public_logo_url,
          public_cover_image_url: pub.public_cover_image_url,
          public_join_note: pub.public_join_note,
        }
      : {}),
  };

  const { data: found, error: fErr } = await admin.from("businesses").select("id").eq("slug", def.slug).maybeSingle();
  if (fErr) throw new Error(fErr.message);
  if (found?.id) {
    const { error: uErr } = await admin.from("businesses").update(row).eq("id", found.id as string);
    if (uErr) throw new Error(uErr.message);
    return found.id as string;
  }
  const { data: ins, error: iErr } = await admin.from("businesses").insert(row).select("id").single();
  if (iErr || !ins) throw new Error(iErr?.message ?? "business insert failed");
  return ins.id as string;
}

async function ensureLocationServiceProvider(
  admin: SupabaseClient,
  businessId: string,
  locationName: string,
  city: string,
  serviceName: string,
  providerName: string,
): Promise<{ locationId: string; serviceId: string; providerId: string }> {
  const { data: locExisting } = await admin
    .from("locations")
    .select("id")
    .eq("business_id", businessId)
    .eq("name", locationName)
    .maybeSingle();
  let locationId: string;
  if (locExisting?.id) {
    locationId = locExisting.id as string;
    const { error: lu } = await admin.from("locations").update({ city, region: "ON" }).eq("id", locationId);
    if (lu) throw new Error(lu.message);
  } else {
    const { data: loc, error: le } = await admin
      .from("locations")
      .insert({ business_id: businessId, name: locationName, city, region: "ON" })
      .select("id")
      .single();
    if (le || !loc) throw new Error(le?.message ?? "location insert");
    locationId = loc.id as string;
  }

  const { data: svcExisting } = await admin
    .from("services")
    .select("id")
    .eq("business_id", businessId)
    .eq("name", serviceName)
    .maybeSingle();
  let serviceId: string;
  if (svcExisting?.id) {
    serviceId = svcExisting.id as string;
    const { error: su } = await admin.from("services").update({ active: true, duration_minutes: 60 }).eq("id", serviceId);
    if (su) throw new Error(su.message);
  } else {
    const { data: svc, error: se } = await admin
      .from("services")
      .insert({ business_id: businessId, name: serviceName, duration_minutes: 60, active: true })
      .select("id")
      .single();
    if (se || !svc) throw new Error(se?.message ?? "service insert");
    serviceId = svc.id as string;
  }

  const { data: provExisting } = await admin
    .from("providers")
    .select("id")
    .eq("business_id", businessId)
    .eq("location_id", locationId)
    .eq("name", providerName)
    .maybeSingle();
  let providerId: string;
  if (provExisting?.id) {
    providerId = provExisting.id as string;
    const { error: pu } = await admin.from("providers").update({ active: true }).eq("id", providerId);
    if (pu) throw new Error(pu.message);
  } else {
    const { data: prov, error: pe } = await admin
      .from("providers")
      .insert({ business_id: businessId, location_id: locationId, name: providerName, active: true })
      .select("id")
      .single();
    if (pe || !prov) throw new Error(pe?.message ?? "provider insert");
    providerId = prov.id as string;
  }

  return { locationId, serviceId, providerId };
}

type EnsuredCustomer = { email: string; authUserId: string; customerId: string };

async function ensureCustomerByEmail(
  admin: SupabaseClient,
  email: string,
  fullName: string,
  channel: { push?: boolean; sms?: boolean; email?: boolean },
): Promise<EnsuredCustomer> {
  const { data: existingCust } = await admin.from("customers").select("id, auth_user_id").eq("email", email).maybeSingle();
  if (existingCust?.id && existingCust.auth_user_id) {
    const { error: upErr } = await admin
      .from("customers")
      .update({
        full_name: fullName,
        push_enabled: channel.push ?? true,
        sms_enabled: channel.sms ?? false,
        email_enabled: channel.email ?? true,
      })
      .eq("id", existingCust.id as string);
    if (upErr) throw new Error(upErr.message);
    return { email, authUserId: existingCust.auth_user_id as string, customerId: existingCust.id as string };
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createErr || !created.user) {
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) throw new Error(listErr.message);
    const u = list.users.find((x) => (x.email ?? "").toLowerCase() === email.toLowerCase());
    if (!u) {
      throw new Error(createErr?.message ?? "createUser failed and no existing auth user matched this email");
    }
    const { data: cust, error: ce } = await admin
      .from("customers")
      .upsert(
        {
          auth_user_id: u.id,
          full_name: fullName,
          email,
          push_enabled: channel.push ?? true,
          sms_enabled: channel.sms ?? false,
          email_enabled: channel.email ?? true,
        },
        { onConflict: "auth_user_id" },
      )
      .select("id")
      .single();
    if (ce || !cust) throw new Error(ce?.message ?? "customers upsert after existing auth failed");
    return { email, authUserId: u.id, customerId: cust.id as string };
  }

  const authUserId = created.user.id;
  const { data: customer, error: custErr } = await admin
    .from("customers")
    .upsert(
      {
        auth_user_id: authUserId,
        full_name: fullName,
        email,
        push_enabled: channel.push ?? true,
        sms_enabled: channel.sms ?? false,
        email_enabled: channel.email ?? true,
      },
      { onConflict: "auth_user_id" },
    )
    .select("id")
    .single();
  if (custErr || !customer) throw new Error(custErr?.message ?? "customers upsert failed");
  return { email, authUserId, customerId: customer.id as string };
}

async function clearDemoGraph(
  admin: SupabaseClient,
  businessIds: string[],
  customerIds: string[],
): Promise<void> {
  if (businessIds.length === 0 || customerIds.length === 0) return;
  const { error: e1 } = await admin
    .from("standby_preferences")
    .delete()
    .in("business_id", businessIds)
    .in("customer_id", customerIds);
  if (e1) throw new Error(e1.message);
  const { error: e2 } = await admin
    .from("customer_standby_requests")
    .delete()
    .in("business_id", businessIds)
    .in("customer_id", customerIds);
  if (e2) throw new Error(e2.message);
  const { error: e3 } = await admin
    .from("customer_business_memberships")
    .delete()
    .in("business_id", businessIds)
    .in("customer_id", customerIds);
  if (e3) throw new Error(e3.message);
  const { error: e4 } = await admin
    .from("customer_notes")
    .delete()
    .in("business_id", businessIds)
    .in("customer_id", customerIds);
  if (e4) throw new Error(e4.message);
}

async function upsertMembership(
  admin: SupabaseClient,
  customerId: string,
  businessId: string,
  source: "invite" | "request" | "public",
): Promise<void> {
  const { error } = await admin.from("customer_business_memberships").upsert(
    { customer_id: customerId, business_id: businessId, status: "active", source },
    { onConflict: "customer_id,business_id" },
  );
  if (error) throw new Error(error.message);
}

async function insertStandbyRequest(
  admin: SupabaseClient,
  businessId: string,
  customerId: string,
  status: "pending" | "declined",
  reviewedAt: string | null,
  reviewedByStaffId: string | null,
): Promise<void> {
  const { error } = await admin.from("customer_standby_requests").insert({
    business_id: businessId,
    customer_id: customerId,
    status,
    message: status === "pending" ? "Demo seed request" : null,
    reviewed_at: reviewedAt,
    reviewed_by_staff_id: reviewedByStaffId,
  });
  if (error) throw new Error(error.message);
}

async function insertPrefs(
  admin: SupabaseClient,
  customerId: string,
  businessId: string,
  locationId: string,
  serviceId: string,
  providerId: string | null,
): Promise<void> {
  const { error } = await admin.from("standby_preferences").insert({
    customer_id: customerId,
    business_id: businessId,
    location_id: locationId,
    service_id: serviceId,
    provider_id: providerId,
    days_of_week: [1, 2, 3, 4, 5],
    active: true,
    max_notice_hours: 48,
  });
  if (error) throw new Error(error.message);
}

function bizId(map: Map<DemoBizSlug, string>, slug: DemoBizSlug): string {
  const id = map.get(slug);
  if (!id) throw new Error(`missing business id for ${slug}`);
  return id;
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const staffAuthId = process.env.DEMO_STAFF_AUTH_USER_ID?.trim();

  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (apps/api/.env).");
    process.exit(1);
  }
  if (!staffAuthId) {
    console.error("Missing DEMO_STAFF_AUTH_USER_ID (auth.users UUID for the Business iOS operator).");
    process.exit(1);
  }

  console.error(`Target Supabase: ${url}`);
  assertSafeToRun(url);

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const businessBySlug = new Map<DemoBizSlug, string>();
  const staffBySlug = new Map<DemoBizSlug, string>();
  const graph = new Map<DemoBizSlug, { locationId: string; serviceId: string; providerId: string }>();

  for (const b of BUSINESSES) {
    const id = await ensureBusiness(admin, b);
    businessBySlug.set(b.slug, id);
    const staffRowId = await ensureStaff(admin, id, staffAuthId);
    staffBySlug.set(b.slug, staffRowId);
    const g = await ensureLocationServiceProvider(
      admin,
      id,
      "Main",
      "Toronto",
      "General appointment",
      "Demo Provider",
    );
    graph.set(b.slug, g);
  }

  const customers = {
    "demo-customer-new@pulsefill.test": await ensureCustomerByEmail(
      admin,
      "demo-customer-new@pulsefill.test",
      "Demo Customer New",
      { push: true, sms: false, email: true },
    ),
    "demo-customer-pending@pulsefill.test": await ensureCustomerByEmail(
      admin,
      "demo-customer-pending@pulsefill.test",
      "Demo Customer Pending",
      { push: true, sms: false, email: true },
    ),
    "demo-customer-joined@pulsefill.test": await ensureCustomerByEmail(
      admin,
      "demo-customer-joined@pulsefill.test",
      "Demo Customer Joined",
      { push: true, sms: false, email: true },
    ),
    "demo-customer-declined@pulsefill.test": await ensureCustomerByEmail(
      admin,
      "demo-customer-declined@pulsefill.test",
      "Demo Customer Declined",
      { push: true, sms: false, email: true },
    ),
    "demo-customer-pref-missing@pulsefill.test": await ensureCustomerByEmail(
      admin,
      "demo-customer-pref-missing@pulsefill.test",
      "Demo Customer Pref Missing",
      { push: false, sms: false, email: false },
    ),
    "demo-waitlist-a@pulsefill.test": await ensureCustomerByEmail(
      admin,
      "demo-waitlist-a@pulsefill.test",
      "Demo Waitlist A",
      { push: true, sms: false, email: true },
    ),
    "demo-waitlist-b@pulsefill.test": await ensureCustomerByEmail(
      admin,
      "demo-waitlist-b@pulsefill.test",
      "Demo Waitlist B",
      { push: true, sms: false, email: true },
    ),
  };

  const allBizIds = [...businessBySlug.values()];
  const allCustIds = DEMO_CUSTOMER_EMAILS.map((e) => customers[e as keyof typeof customers].customerId);
  await clearDemoGraph(admin, allBizIds, allCustIds);

  const york = bizId(businessBySlug, "demo-discovery-yorkville-wellness");
  const queen = bizId(businessBySlug, "demo-discovery-queen-west-studio");
  const midtown = bizId(businessBySlug, "demo-discovery-midtown-physio");
  const king = bizId(businessBySlug, "demo-discovery-king-west-skin-clinic");
  const liberty = bizId(businessBySlug, "demo-discovery-liberty-village-massage");
  const staffYork = staffBySlug.get("demo-discovery-yorkville-wellness")!;
  const staffKing = staffBySlug.get("demo-discovery-king-west-skin-clinic")!;

  const now = new Date().toISOString();

  // Yorkville: two pending (Today count) + one declined reviewer.
  await insertStandbyRequest(admin, york, customers["demo-waitlist-a@pulsefill.test"].customerId, "pending", null, null);
  await insertStandbyRequest(admin, york, customers["demo-waitlist-b@pulsefill.test"].customerId, "pending", null, null);
  await insertStandbyRequest(
    admin,
    york,
    customers["demo-customer-declined@pulsefill.test"].customerId,
    "declined",
    now,
    staffYork,
  );

  // Midtown: canonical “pending” customer for Find list chip QA.
  await insertStandbyRequest(
    admin,
    midtown,
    customers["demo-customer-pending@pulsefill.test"].customerId,
    "pending",
    null,
    null,
  );

  // Queen West: joined + preferences ready (“hard to reach” is the pref-missing customer on King West instead).
  await upsertMembership(admin, customers["demo-customer-joined@pulsefill.test"].customerId, queen, "request");
  const qg = graph.get("demo-discovery-queen-west-studio")!;
  await insertPrefs(
    admin,
    customers["demo-customer-joined@pulsefill.test"].customerId,
    queen,
    qg.locationId,
    qg.serviceId,
    qg.providerId,
  );

  // King West: active membership, no prefs (setup_standby path).
  await upsertMembership(admin, customers["demo-customer-pref-missing@pulsefill.test"].customerId, king, "request");
  await admin.from("customer_notes").insert({
    business_id: king,
    customer_id: customers["demo-customer-pref-missing@pulsefill.test"].customerId,
    body: "Demo: prefers SMS but all channels disabled — hard to reach for offers.",
    created_by_staff_id: staffKing,
    follow_up_at: null,
  });

  // Liberty: rich profile; joined customer with prefs for “preferences on rich business”.
  await upsertMembership(admin, customers["demo-customer-joined@pulsefill.test"].customerId, liberty, "request");
  const lg = graph.get("demo-discovery-liberty-village-massage")!;
  await insertPrefs(
    admin,
    customers["demo-customer-joined@pulsefill.test"].customerId,
    liberty,
    lg.locationId,
    lg.serviceId,
    lg.providerId,
  );

  // demo-customer-new: intentionally no memberships/requests on any demo business (Find “fresh” path).

  const summary = {
    ok: true,
    password: DEMO_PASSWORD,
    operator: {
      dashboard_auth_user_id: staffAuthId,
      owns_all_demo_businesses: true,
    },
    customers: Object.fromEntries(
      DEMO_CUSTOMER_EMAILS.map((e) => {
        const row = customers[e as keyof typeof customers];
        const purpose =
          e === "demo-customer-new@pulsefill.test"
            ? "No relationship — use for fresh request-to-join."
            : e === "demo-customer-pending@pulsefill.test"
              ? "Pending on Midtown Physio."
              : e === "demo-customer-joined@pulsefill.test"
                ? "Joined Queen West + Liberty; prefs on both."
                : e === "demo-customer-declined@pulsefill.test"
                  ? "Declined at Yorkville."
                  : e === "demo-customer-pref-missing@pulsefill.test"
                    ? "Joined King West; no prefs; notes “hard to reach”."
                    : e === "demo-waitlist-a@pulsefill.test"
                      ? "Pending Yorkville (staff queue)."
                      : "Pending Yorkville (staff queue).";
        return [e, { customer_id: row.customerId, purpose }];
      }),
    ),
    businesses: BUSINESSES.map((b) => ({
      slug: b.slug,
      business_id: businessBySlug.get(b.slug),
      directory: b.customer_discovery_enabled ? "listed in Find" : "hidden (invite-only / not discoverable)",
      standby_access_mode: b.standby_access_mode,
      display_name: b.public?.public_display_name ?? b.internalName,
    })),
    qa_hints: {
      customer_ios_find: "Expect five listings (Yorkville, Queen West, Midtown, King West, Liberty). North Toronto Dental is not discoverable.",
      business_ios_today: "Switch to Yorkville Wellness — Today should show 2 pending waitlist requests (demo-waitlist-a / b).",
      north_toronto_detail: "GET directory detail for North Toronto id should 404 for customers (discovery off).",
      north_toronto_business_id: bizId(businessBySlug, "demo-discovery-north-toronto-dental"),
    },
  };

  console.error("\n=== PulseFill discovery demo seed ===\n");
  console.error("All demo customers share password:", DEMO_PASSWORD);
  console.error("Business iOS operator (DEMO_STAFF_AUTH_USER_ID):", staffAuthId);
  console.error("\nBusinesses:");
  for (const b of BUSINESSES) {
    const id = businessBySlug.get(b.slug);
    const line = b.customer_discovery_enabled
      ? `  [Find] ${b.public?.public_display_name ?? b.internalName}  slug=${b.slug}  id=${id}`
      : `  [hidden] ${b.public?.public_display_name ?? b.internalName}  slug=${b.slug}  id=${id}`;
    console.error(line);
  }
  console.error("\nDemo customer emails:");
  for (const e of DEMO_CUSTOMER_EMAILS) {
    const row = customers[e as keyof typeof customers];
    console.error(`  ${e}  customer_id=${row.customerId}`);
  }
  console.error("\nMachine-readable JSON:\n");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
