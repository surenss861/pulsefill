/**
 * Internal demo / QA seed: one realistic workspace (locations, providers, services,
 * customers, memberships, standby prefs, openings, offers, claims, notifications,
 * notes, audit, subscription row).
 *
 * Run from repo root:
 *   pnpm seed:demo
 * Or from apps/api:
 *   pnpm seed:demo
 *
 * Required env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   DEMO_STAFF_AUTH_USER_ID — auth.users id of the operator who should own the demo
 *     workspace (dashboard sign-in). A staff_users row is created for (business, user).
 *
 * Optional:
 *   DEMO_BUSINESS_ID — if set, seed into this existing business (must belong to staff
 *     user). Otherwise a new business is created (slug pf-demo-<timestamp>).
 *
 * Safety:
 *   Refuses non-local Supabase unless PULSEFILL_ALLOW_CUSTOMER_FLOW_SEED=1 (same as
 *   seed-customer-flow).
 *   Refuses NODE_ENV=production unless DEMO_SEED_ALLOW_PRODUCTION=true.
 *   Never invoked by deploy — run manually only.
 *
 * Note: Creating Auth users for customers triggers profile bootstrap and may create
 * extra empty operator workspaces in Supabase; safe to delete those businesses manually
 * if needed (slug prefix wf-).
 */
import { config } from "dotenv";
import { createHash, randomBytes } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { hashInviteToken } from "../src/modules/customers/invite-token.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

function assertSafeToRun(supabaseUrl: string) {
  if (process.env.NODE_ENV === "production" && process.env.DEMO_SEED_ALLOW_PRODUCTION !== "true") {
    console.error("Refusing demo seed: NODE_ENV=production. Set DEMO_SEED_ALLOW_PRODUCTION=true to override.");
    process.exit(1);
  }
  const allow = process.env.PULSEFILL_ALLOW_CUSTOMER_FLOW_SEED === "1";
  const local =
    supabaseUrl.includes("127.0.0.1") ||
    supabaseUrl.includes("localhost") ||
    /54321/.test(supabaseUrl);
  if (!local && !allow) {
    console.error(
      "Refusing demo seed: Supabase URL does not look local. Set PULSEFILL_ALLOW_CUSTOMER_FLOW_SEED=1 for shared/staging.",
    );
    process.exit(1);
  }
}

function hoursFromNowIso(hours: number): string {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString();
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
      full_name: "Demo Operator",
      email: "demo.operator@pulsefill.invalid",
    })
    .select("id")
    .single();
  if (error || !row) throw new Error(error?.message ?? "staff_users insert failed");
  return row.id as string;
}

async function createAuthCustomer(
  admin: SupabaseClient,
  label: string,
  opts: { push?: boolean; sms?: boolean; email?: boolean },
): Promise<{ authUserId: string; customerId: string; email: string; password: string }> {
  const stamp = `${Date.now()}_${randomBytes(4).toString("hex")}`;
  const email = `demo.${label}.${stamp}@pulsefill.test`;
  const password = `Demo-${stamp}-Aa1`;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) throw new Error(createErr?.message ?? "createUser failed");
  const authUserId = created.user.id;

  const { data: customer, error: custErr } = await admin
    .from("customers")
    .upsert(
      {
        auth_user_id: authUserId,
        full_name: `Demo ${label}`,
        email,
        push_enabled: opts.push ?? true,
        sms_enabled: opts.sms ?? false,
        email_enabled: opts.email ?? true,
      },
      { onConflict: "auth_user_id" },
    )
    .select("id")
    .single();
  if (custErr || !customer) throw new Error(custErr?.message ?? "customers upsert failed");
  return { authUserId, customerId: customer.id as string, email, password };
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const staffAuthId = process.env.DEMO_STAFF_AUTH_USER_ID?.trim();
  const existingBusinessId = process.env.DEMO_BUSINESS_ID?.trim();

  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (apps/api/.env).");
    process.exit(1);
  }
  if (!staffAuthId) {
    console.error("Missing DEMO_STAFF_AUTH_USER_ID (auth.users UUID for the dashboard operator).");
    process.exit(1);
  }

  console.error(`Target Supabase: ${url}`);
  assertSafeToRun(url);

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  let businessId: string;
  let businessSlug: string;

  if (existingBusinessId) {
    const { data: biz, error: bizErr } = await admin.from("businesses").select("id, slug").eq("id", existingBusinessId).single();
    if (bizErr || !biz) {
      console.error("DEMO_BUSINESS_ID not found:", bizErr?.message);
      process.exit(1);
    }
    businessId = biz.id as string;
    businessSlug = biz.slug as string;
    console.error(`Using existing business ${businessId} (${businessSlug})`);
  } else {
    const stamp = Date.now();
    businessSlug = `pf-demo-${stamp}`;
    const { data: business, error: bizErr } = await admin
      .from("businesses")
      .insert({
        name: `PulseFill Demo Workspace`,
        slug: businessSlug,
        timezone: "America/New_York",
        standby_access_mode: "private",
        customer_discovery_enabled: false,
      })
      .select("id")
      .single();
    if (bizErr || !business) {
      console.error("businesses insert failed:", bizErr?.message);
      process.exit(1);
    }
    businessId = business.id as string;
    console.error(`Created business ${businessId} slug=${businessSlug}`);
  }

  const staffId = await ensureStaff(admin, businessId, staffAuthId);

  const { data: loc1, error: e1 } = await admin
    .from("locations")
    .insert({ business_id: businessId, name: "Yorkville Wellness", city: "Toronto", region: "ON" })
    .select("id")
    .single();
  if (e1 || !loc1) throw new Error(e1?.message ?? "loc1");
  const { data: loc2, error: e2 } = await admin
    .from("locations")
    .insert({ business_id: businessId, name: "Downtown Studio", city: "Toronto", region: "ON" })
    .select("id")
    .single();
  if (e2 || !loc2) throw new Error(e2?.message ?? "loc2");

  const { data: prov1, error: p1 } = await admin
    .from("providers")
    .insert({ business_id: businessId, location_id: loc1.id as string, name: "Maya Patel", active: true })
    .select("id")
    .single();
  if (p1 || !prov1) throw new Error(p1?.message ?? "prov1");
  const { data: prov2, error: p2 } = await admin
    .from("providers")
    .insert({ business_id: businessId, location_id: loc2.id as string, name: "Daniel Kim", active: true })
    .select("id")
    .single();
  if (p2 || !prov2) throw new Error(p2?.message ?? "prov2");

  const serviceNames = ["Consultation", "Follow-up visit", "Skin treatment", "Wellness check"];
  const serviceIds: string[] = [];
  for (const name of serviceNames) {
    const { data: svc, error: se } = await admin
      .from("services")
      .insert({ business_id: businessId, name, duration_minutes: 60, active: true })
      .select("id")
      .single();
    if (se || !svc) throw new Error(se?.message ?? "service");
    serviceIds.push(svc.id as string);
  }
  const [svcConsult, svcFollow, svcSkin, svcWell] = serviceIds;

  const cReach = await createAuthCustomer(admin, "Reachable", { push: true });
  const cQuiet = await createAuthCustomer(admin, "QuietPush", { push: false });
  const cBare = await createAuthCustomer(admin, "BareMember", { push: true });

  for (const cid of [cReach.customerId, cQuiet.customerId, cBare.customerId]) {
    const { error: memErr } = await admin.from("customer_business_memberships").upsert(
      { customer_id: cid, business_id: businessId, status: "active", source: "invite" },
      { onConflict: "customer_id,business_id", ignoreDuplicates: false },
    );
    if (memErr) throw new Error(memErr.message);
  }

  await admin.from("standby_preferences").insert({
    customer_id: cReach.customerId,
    business_id: businessId,
    location_id: loc1.id as string,
    service_id: svcConsult,
    provider_id: prov1.id as string,
    days_of_week: [1, 2, 3, 4, 5, 6, 0],
    active: true,
    max_notice_hours: 48,
  });
  await admin.from("standby_preferences").insert({
    customer_id: cReach.customerId,
    business_id: businessId,
    location_id: loc1.id as string,
    service_id: null,
    provider_id: null,
    days_of_week: [1, 2, 3, 4, 5],
    active: true,
    max_notice_hours: 24,
  });
  await admin.from("standby_preferences").insert({
    customer_id: cQuiet.customerId,
    business_id: businessId,
    location_id: loc2.id as string,
    service_id: svcSkin,
    provider_id: prov2.id as string,
    days_of_week: [1, 3, 5],
    active: true,
    max_notice_hours: 6,
  });

  const token = randomBytes(24).toString("hex");
  const pendingEmail = `demo.pending.invite.${Date.now()}@pulsefill.test`;
  const { error: invErr } = await admin.from("customer_invites").insert({
    business_id: businessId,
    email: pendingEmail,
    token_hash: hashInviteToken(token),
    status: "pending",
    expires_at: hoursFromNowIso(24 * 14),
    created_by_staff_id: staffId,
    customer_name: "Pending Invite",
    invite_token: token,
  });
  if (invErr) throw new Error(invErr.message);

  const pushTok = `demo_apns_${randomBytes(16).toString("hex")}`;
  await admin.from("customer_push_devices").insert({
    customer_id: cReach.customerId,
    platform: "ios",
    device_token: pushTok,
    token_type: "apns",
    environment: "development",
    active: true,
  });

  const startsOpen = hoursFromNowIso(48);
  const endsOpen = hoursFromNowIso(49);
  const { data: slotOpen, error: soErr } = await admin
    .from("open_slots")
    .insert({
      business_id: businessId,
      location_id: loc1.id as string,
      provider_id: prov1.id as string,
      service_id: svcConsult,
      provider_name_snapshot: "Maya Patel",
      starts_at: startsOpen,
      ends_at: endsOpen,
      status: "open",
      notes: "Demo — open, awaiting offers",
      created_by: staffId,
    })
    .select("id")
    .single();
  if (soErr || !slotOpen) throw new Error(soErr?.message ?? "slotOpen");

  await admin.from("audit_events").insert({
    business_id: businessId,
    actor_type: "system",
    actor_id: null,
    event_type: "offers_no_match",
    entity_type: "open_slot",
    entity_id: slotOpen.id as string,
    metadata: {
      match_summary: "No eligible standby customers matched filters.",
      match_diagnostics: { reason_codes: ["notice_window"], demo_seed: true },
    },
  });

  const startsOffer = hoursFromNowIso(72);
  const endsOffer = hoursFromNowIso(73);
  const { data: slotOffered, error: sOffErr } = await admin
    .from("open_slots")
    .insert({
      business_id: businessId,
      location_id: loc1.id as string,
      provider_id: prov1.id as string,
      service_id: svcFollow,
      provider_name_snapshot: "Maya Patel",
      starts_at: startsOffer,
      ends_at: endsOffer,
      status: "offered",
      last_offer_batch_at: new Date().toISOString(),
      notes: "Demo — offers out",
      created_by: staffId,
    })
    .select("id")
    .single();
  if (sOffErr || !slotOffered) throw new Error(sOffErr?.message ?? "slotOffered");

  const exp1 = hoursFromNowIso(36);
  const { data: off1, error: of1e } = await admin
    .from("slot_offers")
    .insert({
      open_slot_id: slotOffered.id as string,
      customer_id: cReach.customerId,
      channel: "push",
      status: "sent",
      expires_at: exp1,
    })
    .select("id")
    .single();
  if (of1e || !off1) throw new Error(of1e?.message ?? "off1");
  const { data: off2, error: of2e } = await admin
    .from("slot_offers")
    .insert({
      open_slot_id: slotOffered.id as string,
      customer_id: cQuiet.customerId,
      channel: "push",
      status: "delivered",
      expires_at: exp1,
    })
    .select("id")
    .single();
  if (of2e || !off2) throw new Error(of2e?.message ?? "off2");

  await admin.from("notification_logs").insert({
    open_slot_id: slotOffered.id as string,
    slot_offer_id: off1.id as string,
    customer_id: cReach.customerId,
    channel: "push",
    status: "sent",
    metadata: { demo_seed: true },
  });
  await admin.from("notification_logs").insert({
    open_slot_id: slotOffered.id as string,
    slot_offer_id: off2.id as string,
    customer_id: cQuiet.customerId,
    channel: "push",
    status: "skipped",
    error: "push_disabled",
    metadata: { demo_seed: true },
  });

  const dedupe1 = `demo:offer_sent:${off1.id}`;
  await admin.from("notification_delivery_attempts").insert({
    business_id: businessId,
    customer_id: cReach.customerId,
    open_slot_id: slotOffered.id as string,
    type: "offer_received",
    channel: "push",
    decision: "send",
    status: "sent",
    dedupe_key: dedupe1,
    provider: "noop",
    payload: { demo_seed: true },
  });
  const dedupe2 = `demo:offer_suppressed:${off2.id}`;
  await admin.from("notification_delivery_attempts").insert({
    business_id: businessId,
    customer_id: cQuiet.customerId,
    open_slot_id: slotOffered.id as string,
    type: "offer_received",
    channel: "push",
    decision: "suppress",
    status: "suppressed",
    dedupe_key: dedupe2,
    suppression_reason: "push_disabled",
    payload: { demo_seed: true },
  });

  const startsClaim = hoursFromNowIso(96);
  const endsClaim = hoursFromNowIso(97);
  const { data: slotClaimed, error: scErr } = await admin
    .from("open_slots")
    .insert({
      business_id: businessId,
      location_id: loc2.id as string,
      provider_id: prov2.id as string,
      service_id: svcWell,
      provider_name_snapshot: "Daniel Kim",
      starts_at: startsClaim,
      ends_at: endsClaim,
      status: "offered",
      last_offer_batch_at: new Date().toISOString(),
      notes: "Demo — claimed, needs confirmation",
      created_by: staffId,
    })
    .select("id")
    .single();
  if (scErr || !slotClaimed) throw new Error(scErr?.message ?? "slotClaimed");

  const expC = hoursFromNowIso(60);
  const { data: offC, error: oce } = await admin
    .from("slot_offers")
    .insert({
      open_slot_id: slotClaimed.id as string,
      customer_id: cReach.customerId,
      channel: "push",
      status: "sent",
      expires_at: expC,
    })
    .select("id")
    .single();
  if (oce || !offC) throw new Error(oce?.message ?? "offC");

  const claimRpc = await admin.rpc("claim_open_slot", {
    p_open_slot_id: slotClaimed.id as string,
    p_customer_id: cReach.customerId,
    p_deposit_payment_intent_id: null,
  });
  if (claimRpc.error) throw new Error(claimRpc.error.message);
  const claimRes = claimRpc.data as { ok?: boolean; error?: string; claim_id?: string };
  if (!claimRes?.ok) throw new Error(claimRes?.error ?? "claim failed");
  const pendingClaimId = claimRes.claim_id as string;

  const startsBook = hoursFromNowIso(120);
  const endsBook = hoursFromNowIso(121);
  const { data: slotBook, error: sbErr } = await admin
    .from("open_slots")
    .insert({
      business_id: businessId,
      location_id: loc1.id as string,
      provider_id: prov1.id as string,
      service_id: svcSkin,
      provider_name_snapshot: "Maya Patel",
      starts_at: startsBook,
      ends_at: endsBook,
      status: "offered",
      last_offer_batch_at: new Date().toISOString(),
      notes: "Demo — booked / recovered",
      created_by: staffId,
    })
    .select("id")
    .single();
  if (sbErr || !slotBook) throw new Error(sbErr?.message ?? "slotBook");

  const { data: offB, error: obe } = await admin
    .from("slot_offers")
    .insert({
      open_slot_id: slotBook.id as string,
      customer_id: cReach.customerId,
      channel: "push",
      status: "sent",
      expires_at: hoursFromNowIso(80),
    })
    .select("id")
    .single();
  if (obe || !offB) throw new Error(obe?.message ?? "offB");

  const claimB = await admin.rpc("claim_open_slot", {
    p_open_slot_id: slotBook.id as string,
    p_customer_id: cReach.customerId,
    p_deposit_payment_intent_id: null,
  });
  if (claimB.error) throw new Error(claimB.error.message);
  const claimBRes = claimB.data as { ok?: boolean; claim_id?: string };
  if (!claimBRes?.ok) throw new Error("claim book failed");
  const bookedClaimId = claimBRes.claim_id as string;

  const confirm = await admin.rpc("confirm_open_slot_claim", {
    p_open_slot_id: slotBook.id as string,
    p_claim_id: bookedClaimId,
    p_staff_auth_user_id: staffAuthId,
  });
  if (confirm.error) throw new Error(confirm.error.message);
  const confRes = confirm.data as { ok?: boolean; error?: string };
  if (!confRes?.ok) throw new Error(confRes?.error ?? "confirm failed");

  const startsPast = hoursAgoIso(72);
  const endsPast = hoursAgoIso(71);
  const { data: slotExpired, error: sxErr } = await admin
    .from("open_slots")
    .insert({
      business_id: businessId,
      location_id: loc2.id as string,
      provider_id: prov2.id as string,
      service_id: svcFollow,
      provider_name_snapshot: "Daniel Kim",
      starts_at: startsPast,
      ends_at: endsPast,
      status: "expired",
      notes: "Demo — expired unfilled",
      created_by: staffId,
    })
    .select("id")
    .single();
  if (sxErr || !slotExpired) throw new Error(sxErr?.message ?? "slotExpired");

  const followDue = hoursFromNowIso(48);
  const followDone = hoursAgoIso(24);
  const { data: noteOpen, error: n1e } = await admin
    .from("customer_notes")
    .insert({
      business_id: businessId,
      customer_id: cReach.customerId,
      body: "Demo: customer prefers morning slots. Mention parking validation.",
      created_by_staff_id: staffId,
      follow_up_at: followDue,
    })
    .select("id")
    .single();
  if (n1e || !noteOpen) throw new Error(n1e?.message ?? "noteOpen");
  const { error: n2e } = await admin.from("customer_notes").insert({
    business_id: businessId,
    customer_id: cReach.customerId,
    body: "Demo: follow-up completed — left voicemail.",
    created_by_staff_id: staffId,
    follow_up_at: followDone,
    follow_up_completed_at: new Date().toISOString(),
  });
  if (n2e) throw new Error(n2e.message);

  const today = new Date().toISOString().slice(0, 10);
  await admin.from("daily_metrics").upsert(
    {
      business_id: businessId,
      metric_date: today,
      open_slots_count: 5,
      offers_sent_count: 4,
      recovered_slots_count: 1,
      recovered_revenue_cents: 12_500,
    },
    { onConflict: "business_id,metric_date" },
  );

  const periodEnd = hoursFromNowIso(24 * 10);
  const { data: subRows } = await admin.from("subscriptions").select("id").eq("business_id", businessId).limit(1);
  const existingSubId = (subRows?.[0] as { id?: string } | undefined)?.id;
  if (existingSubId) {
    const { error: uSub } = await admin
      .from("subscriptions")
      .update({
        plan: "starter",
        status: "trialing",
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingSubId);
    if (uSub) throw new Error(uSub.message);
  } else {
    const { error: iSub } = await admin.from("subscriptions").insert({
      business_id: businessId,
      plan: "starter",
      status: "trialing",
      current_period_end: periodEnd,
    });
    if (iSub) throw new Error(iSub.message);
  }

  await admin.from("audit_events").insert({
    business_id: businessId,
    actor_type: "staff",
    actor_id: staffId,
    event_type: "offers_sent",
    entity_type: "open_slot",
    entity_id: slotOffered.id as string,
    metadata: { demo_seed: true, batch_size: 2 },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        business_id: businessId,
        business_slug: businessSlug,
        staff_users_id: staffId,
        dashboard_operator_auth_id: staffAuthId,
        locations: [loc1.id, loc2.id],
        providers: [prov1.id, prov2.id],
        services: serviceIds,
        customers: {
          reachable: cReach,
          quiet_push: cQuiet,
          bare_membership: cBare,
        },
        pending_invite_email: pendingEmail,
        pending_invite_token: token,
        open_slots: {
          open_no_match_audit: slotOpen.id,
          offered_multi_offer: slotOffered.id,
          claimed_pending_confirm: slotClaimed.id,
          booked: slotBook.id,
          expired: slotExpired.id,
        },
        claims: { pending_confirmation: pendingClaimId, booked: bookedClaimId },
        customer_notes: { open_follow_up: noteOpen.id },
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
