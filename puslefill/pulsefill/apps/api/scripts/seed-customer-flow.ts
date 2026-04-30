/**
 * Dev/local seed: one customer + business graph + open slot + active slot_offer
 * (optionally claim + push device stub + synthetic notification_delivery_attempts row).
 *
 * Run from apps/api:
 *   pnpm seed:customer-flow
 *   pnpm seed:customer-flow -- --claim --push --attempt
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (e.g. apps/api/.env).
 * Non-local URLs also require PULSEFILL_ALLOW_CUSTOMER_FLOW_SEED=1.
 */
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

function parseArgs(argv: string[]) {
  const flags = new Set<string>();
  let email: string | undefined;
  let password: string | undefined;
  for (const a of argv) {
    if (a === "--claim") flags.add("claim");
    else if (a === "--push") flags.add("push");
    else if (a === "--attempt") flags.add("attempt");
    else if (a.startsWith("--email=")) email = a.slice("--email=".length);
    else if (a.startsWith("--password=")) password = a.slice("--password=".length);
  }
  return { flags, email, password };
}

function assertSafeToSeed(supabaseUrl: string) {
  const allow = process.env.PULSEFILL_ALLOW_CUSTOMER_FLOW_SEED === "1";
  const local =
    supabaseUrl.includes("127.0.0.1") ||
    supabaseUrl.includes("localhost") ||
    /54321/.test(supabaseUrl);
  if (!local && !allow) {
    console.error(
      "Refusing to seed: Supabase URL does not look local. Set PULSEFILL_ALLOW_CUSTOMER_FLOW_SEED=1 to proceed on shared/staging projects.",
    );
    process.exit(1);
  }
}

function hoursFromNowIso(hours: number): string {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (load apps/api/.env).");
    process.exit(1);
  }
  assertSafeToSeed(url);

  const { flags, email: emailArg, password: passwordArg } = parseArgs(process.argv.slice(2));
  const wantClaim = flags.has("claim");
  const wantPush = flags.has("push");
  const wantAttempt = flags.has("attempt");

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const stamp = Date.now();
  const email = emailArg ?? `seed.customer.${stamp}@pulsefill.test`;
  const password = passwordArg ?? `Seed-${stamp}-Aa1`;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) {
    console.error("auth.admin.createUser failed:", createErr?.message ?? "no user");
    process.exit(1);
  }
  const authUserId = created.user.id;

  const { data: customer, error: custErr } = await admin
    .from("customers")
    .upsert(
      {
        auth_user_id: authUserId,
        full_name: "Seed Customer",
        email,
        push_enabled: true,
      },
      { onConflict: "auth_user_id" },
    )
    .select("id")
    .single();

  if (custErr || !customer) {
    console.error("customers upsert failed:", custErr?.message);
    process.exit(1);
  }
  const customerId = customer.id as string;

  const slug = `seed-flow-${stamp}`;
  const { data: business, error: bizErr } = await admin
    .from("businesses")
    .insert({
      name: `Seed Clinic ${stamp}`,
      slug,
      timezone: "America/New_York",
    })
    .select("id")
    .single();
  if (bizErr || !business) {
    console.error("businesses insert failed:", bizErr?.message);
    process.exit(1);
  }
  const businessId = business.id as string;

  const { data: location, error: locErr } = await admin
    .from("locations")
    .insert({ business_id: businessId, name: "Seed Location", city: "Toronto" })
    .select("id")
    .single();
  if (locErr || !location) {
    console.error("locations insert failed:", locErr?.message);
    process.exit(1);
  }

  const { data: provider, error: provErr } = await admin
    .from("providers")
    .insert({ business_id: businessId, location_id: location.id as string, name: "Dr. Seed" })
    .select("id")
    .single();
  if (provErr || !provider) {
    console.error("providers insert failed:", provErr?.message);
    process.exit(1);
  }

  const { data: service, error: svcErr } = await admin
    .from("services")
    .insert({ business_id: businessId, name: "Dental cleaning", duration_minutes: 60 })
    .select("id")
    .single();
  if (svcErr || !service) {
    console.error("services insert failed:", svcErr?.message);
    process.exit(1);
  }

  const startsAt = hoursFromNowIso(72);
  const endsAt = hoursFromNowIso(73);

  const { data: slot, error: slotErr } = await admin
    .from("open_slots")
    .insert({
      business_id: businessId,
      location_id: location.id as string,
      provider_id: provider.id as string,
      service_id: service.id as string,
      provider_name_snapshot: "Dr. Seed",
      starts_at: startsAt,
      ends_at: endsAt,
      notes: "Dental cleaning",
      status: "offered",
    })
    .select("id")
    .single();
  if (slotErr || !slot) {
    console.error("open_slots insert failed:", slotErr?.message);
    process.exit(1);
  }
  const openSlotId = slot.id as string;

  const expiresAt = hoursFromNowIso(48);
  const { data: offer, error: offerErr } = await admin
    .from("slot_offers")
    .insert({
      open_slot_id: openSlotId,
      customer_id: customerId,
      channel: "push",
      status: "sent",
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (offerErr || !offer) {
    console.error("slot_offers insert failed:", offerErr?.message);
    process.exit(1);
  }
  const offerId = offer.id as string;

  await admin.from("standby_preferences").insert({
    customer_id: customerId,
    business_id: businessId,
    location_id: location.id as string,
    service_id: service.id as string,
    provider_id: provider.id as string,
    days_of_week: [1, 2, 3, 4, 5],
    active: true,
  });

  let claimId: string | undefined;
  if (wantClaim) {
    const { data: rpcData, error: rpcErr } = await admin.rpc("claim_open_slot", {
      p_open_slot_id: openSlotId,
      p_customer_id: customerId,
      p_deposit_payment_intent_id: null,
    });
    if (rpcErr) {
      console.error("claim_open_slot rpc error:", rpcErr.message);
      process.exit(1);
    }
    const res = rpcData as { ok?: boolean; error?: string; claim_id?: string };
    if (!res?.ok) {
      console.error("claim_open_slot rejected:", res?.error ?? rpcData);
      process.exit(1);
    }
    claimId = res.claim_id;
  }

  if (wantPush) {
    const token = `seed_apns_${randomUUID().replace(/-/g, "")}`;
    const { error: pushErr } = await admin.from("customer_push_devices").insert({
      customer_id: customerId,
      platform: "ios",
      device_token: token,
      token_type: "apns",
      environment: "development",
      active: true,
    });
    if (pushErr) {
      console.error("customer_push_devices insert failed:", pushErr.message);
      process.exit(1);
    }
  }

  if (wantAttempt) {
    const dedupeKey = `offer_received:${offerId}`;
    const { error: attErr } = await admin.from("notification_delivery_attempts").insert({
      business_id: businessId,
      customer_id: customerId,
      open_slot_id: openSlotId,
      claim_id: claimId ?? null,
      type: "offer_received",
      channel: "push",
      decision: "send",
      status: "sent",
      dedupe_key: dedupeKey,
      payload: { seeded: true, offer_id: offerId },
      provider: process.env.PUSH_PROVIDER ?? "noop",
    });
    if (attErr) {
      console.error("notification_delivery_attempts insert failed:", attErr.message);
      process.exit(1);
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        sign_in: { email, password },
        ids: {
          auth_user_id: authUserId,
          customer_id: customerId,
          business_id: businessId,
          location_id: location.id,
          provider_id: provider.id,
          service_id: service.id,
          open_slot_id: openSlotId,
          offer_id: offerId,
          claim_id: claimId ?? null,
        },
        flags: { claim: wantClaim, push: wantPush, attempt: wantAttempt },
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
