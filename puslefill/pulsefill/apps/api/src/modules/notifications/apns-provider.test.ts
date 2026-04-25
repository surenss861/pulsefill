import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import type { PulseFillPushPayload } from "./push-payloads.js";
import { createApnsPushProvider } from "./apns-provider.js";

function samplePayload(): PulseFillPushPayload {
  return {
    type: "customer_offer_sent",
    title: "New opening available",
    body: "Dental cleaning is available soon.",
    deep_link: "/customer/offers/offer_1",
    dedupe_key: "customer_offer_sent:offer_1",
    created_at: "2026-04-25T12:00:00.000Z",
    business_id: "11111111-1111-4111-8111-111111111111",
    open_slot_id: "22222222-2222-4222-8222-222222222222",
    customer_id: "33333333-3333-4333-8333-333333333333",
    actor: "system",
    data: {
      type: "customer_offer_sent",
      business_id: "11111111-1111-4111-8111-111111111111",
      customer_id: "33333333-3333-4333-8333-333333333333",
      open_slot_id: "22222222-2222-4222-8222-222222222222",
      offer_id: "offer_1",
    },
  };
}

function testPrivateKey(): string {
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  return privateKey.export({ format: "pem", type: "pkcs8" }).toString();
}

test("createApnsPushProvider builds sandbox URL, headers, and body", async () => {
  const captured: { url?: string; init?: { headers: Record<string, string>; body: string } } = {};
  const provider = createApnsPushProvider(
    {
      teamId: "TEAM123",
      keyId: "KEY123",
      privateKey: testPrivateKey(),
      bundleId: "com.pulsefill.app",
      environment: "sandbox",
    },
    {
      nowIso: () => "2026-04-25T12:00:00.000Z",
      httpClient: async (url, init) => {
        captured.url = url;
        captured.init = init;
        return {
          status: 200,
          headers: new Headers({ "apns-id": "apns-id-1" }),
          text: async () => "",
        };
      },
    },
  );

  const out = await provider.send({
    payload: samplePayload(),
    device_token: "abc123token",
    dedupe_key: "customer_offer_sent:offer_1",
  });

  assert.equal(captured.url, "https://api.sandbox.push.apple.com/3/device/abc123token");
  assert.ok(captured.init);
  assert.equal(captured.init.headers["apns-topic"], "com.pulsefill.app");
  assert.equal(captured.init.headers["apns-push-type"], "alert");
  assert.equal(captured.init.headers["apns-priority"], "10");
  assert.equal(captured.init.headers["apns-collapse-id"], "customer_offer_sent:offer_1");
  assert.ok(captured.init.headers.authorization);
  assert.ok(captured.init.headers.authorization.startsWith("bearer "));
  const parsed = JSON.parse(captured.init.body) as Record<string, unknown>;
  assert.equal((parsed.aps as { alert: { title: string } }).alert.title, "New opening available");
  assert.equal((parsed.aps as { alert: { body: string } }).alert.body, "Dental cleaning is available soon.");
  assert.equal(parsed.deep_link, "/customer/offers/offer_1");
  assert.equal(parsed.type, "customer_offer_sent");
  assert.equal(out.ok, true);
  if (out.ok) {
    assert.equal(out.provider_message_id, "apns-id-1");
  }
});

test("createApnsPushProvider builds production URL", async () => {
  let urlSeen = "";
  const provider = createApnsPushProvider(
    {
      teamId: "TEAM123",
      keyId: "KEY123",
      privateKey: testPrivateKey(),
      bundleId: "com.pulsefill.app",
      environment: "production",
    },
    {
      httpClient: async (url) => {
        urlSeen = url;
        return {
          status: 200,
          headers: new Headers(),
          text: async () => "",
        };
      },
    },
  );

  await provider.send({
    payload: samplePayload(),
    device_token: "prod-token",
    dedupe_key: "customer_offer_sent:offer_1",
  });

  assert.equal(urlSeen, "https://api.push.apple.com/3/device/prod-token");
});

test("createApnsPushProvider maps 429/500/503 to retryable failures", async () => {
  for (const status of [429, 500, 503]) {
    const provider = createApnsPushProvider(
      {
        teamId: "TEAM123",
        keyId: "KEY123",
        privateKey: testPrivateKey(),
        bundleId: "com.pulsefill.app",
        environment: "sandbox",
      },
      {
        nowIso: () => "2026-04-25T12:10:00.000Z",
        httpClient: async () => ({
          status,
          headers: new Headers(),
          text: async () => JSON.stringify({ reason: "TooManyRequests" }),
        }),
      },
    );
    const out = await provider.send({
      payload: samplePayload(),
      device_token: "token",
      dedupe_key: "customer_offer_sent:offer_1",
    });
    assert.equal(out.ok, false);
    if (!out.ok) {
      assert.equal(out.retryable, true);
      assert.equal(out.error_code, "apns_toomanyrequests");
    }
  }
});

test("createApnsPushProvider maps 400/403/410 to non-retryable failures", async () => {
  for (const status of [400, 403, 410]) {
    const provider = createApnsPushProvider(
      {
        teamId: "TEAM123",
        keyId: "KEY123",
        privateKey: testPrivateKey(),
        bundleId: "com.pulsefill.app",
        environment: "sandbox",
      },
      {
        nowIso: () => "2026-04-25T12:15:00.000Z",
        httpClient: async () => ({
          status,
          headers: new Headers(),
          text: async () => JSON.stringify({ reason: "BadDeviceToken" }),
        }),
      },
    );
    const out = await provider.send({
      payload: samplePayload(),
      device_token: "token",
      dedupe_key: "customer_offer_sent:offer_1",
    });
    assert.equal(out.ok, false);
    if (!out.ok) {
      assert.equal(out.retryable, false);
      assert.equal(out.error_code, "apns_baddevicetoken");
    }
  }
});

test("createApnsPushProvider handles APNs JSON reason body", async () => {
  const provider = createApnsPushProvider(
    {
      teamId: "TEAM123",
      keyId: "KEY123",
      privateKey: testPrivateKey(),
      bundleId: "com.pulsefill.app",
      environment: "sandbox",
    },
    {
      nowIso: () => "2026-04-25T12:20:00.000Z",
      httpClient: async () => ({
        status: 403,
        headers: new Headers(),
        text: async () => JSON.stringify({ reason: "InvalidProviderToken" }),
      }),
    },
  );
  const out = await provider.send({
    payload: samplePayload(),
    device_token: "token",
    dedupe_key: "customer_offer_sent:offer_1",
  });

  assert.equal(out.ok, false);
  if (!out.ok) {
    assert.equal(out.error_code, "apns_invalidprovidertoken");
    assert.match(out.error_message, /InvalidProviderToken/);
  }
});

test("createApnsPushProvider maps network errors to retryable failure", async () => {
  const provider = createApnsPushProvider(
    {
      teamId: "TEAM123",
      keyId: "KEY123",
      privateKey: testPrivateKey(),
      bundleId: "com.pulsefill.app",
      environment: "sandbox",
    },
    {
      nowIso: () => "2026-04-25T12:25:00.000Z",
      httpClient: async () => {
        throw new Error("socket hang up");
      },
    },
  );
  const out = await provider.send({
    payload: samplePayload(),
    device_token: "token",
    dedupe_key: "customer_offer_sent:offer_1",
  });

  assert.equal(out.ok, false);
  if (!out.ok) {
    assert.equal(out.retryable, true);
    assert.equal(out.error_code, "apns_network_error");
    assert.match(out.error_message, /socket hang up/);
  }
});
