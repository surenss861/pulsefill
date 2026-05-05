import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";

import { createApnsJwt, sendApnsPush } from "./apns-http.js";

function decodeJwtSegment(segment: string): unknown {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  const b64 = padded + "=".repeat(padLen);
  return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
}

function testEs256PrivateKeyPem(): string {
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  return privateKey.export({ format: "pem", type: "pkcs8" }).toString();
}

describe("createApnsJwt", () => {
  it("returns a three-part JWT-shaped string", () => {
    const pem = testEs256PrivateKeyPem();
    const jwt = createApnsJwt({
      teamId: "ABCDE12345",
      keyId: "KEY1ABCDE",
      privateKey: pem,
      issuedAtSeconds: 1_700_000_000,
    });
    const parts = jwt.split(".");
    expect(parts).toHaveLength(3);
    expect(parts[0].length).toBeGreaterThan(10);
    expect(parts[1].length).toBeGreaterThan(10);
    expect(parts[2].length).toBeGreaterThan(10);
  });

  it("header is ES256 with kid; payload has iss (team) and iat", () => {
    const pem = testEs256PrivateKeyPem();
    const jwt = createApnsJwt({
      teamId: "TEAM99",
      keyId: "KID99",
      privateKey: pem,
      issuedAtSeconds: 1_720_000_000,
    });
    const [h, p] = jwt.split(".");
    const header = decodeJwtSegment(h) as { alg: string; kid: string };
    const claims = decodeJwtSegment(p) as { iss: string; iat: number };
    expect(header.alg).toBe("ES256");
    expect(header.kid).toBe("KID99");
    expect(claims.iss).toBe("TEAM99");
    expect(claims.iat).toBe(1_720_000_000);
  });

  it("does not embed PEM or private key material in decodable header or claims", () => {
    const pem = testEs256PrivateKeyPem();
    const jwt = createApnsJwt({
      teamId: "T1",
      keyId: "K1",
      privateKey: pem,
      issuedAtSeconds: 1_710_000_000,
    });
    const [h, p] = jwt.split(".");
    const headerRaw = Buffer.from(h.replace(/-/g, "+").replace(/_/g, "/"), "base64url").toString("utf8");
    const payloadRaw = Buffer.from(p.replace(/-/g, "+").replace(/_/g, "/"), "base64url").toString("utf8");
    expect(headerRaw).not.toMatch(/BEGIN|PRIVATE|KEY/);
    expect(payloadRaw).not.toMatch(/BEGIN|PRIVATE|KEY/);
    expect(jwt).not.toContain("BEGIN PRIVATE");
  });
});

describe("sendApnsPush", () => {
  it("does not call real Apple when fetchImpl is injected", async () => {
    const pem = testEs256PrivateKeyPem();
    const captured: { url?: string; authPrefix?: string; body?: string } = {};

    const fetchImpl: typeof fetch = async (url, init) => {
      captured.url = typeof url === "string" ? url : (url as URL).toString();
      const headers = new Headers(init?.headers);
      captured.authPrefix = headers.get("authorization")?.slice(0, 10) ?? "";
      captured.body = typeof init?.body === "string" ? init.body : "";
      return new Response("", { status: 200, headers: { "apns-id": "unit-test-apns" } });
    };

    const out = await sendApnsPush(
      {
        teamId: "T",
        keyId: "K",
        privateKey: pem,
        bundleId: "com.example.app",
        environment: "sandbox",
      },
      {
        deviceToken: "abc123",
        collapseId: "offer_received:x",
        body: {
          aps: { alert: { title: "Hi", body: "There" }, sound: "default" },
          type: "offer_received",
          offer_id: "x",
        },
        nowIso: () => "2026-01-01T00:00:00.000Z",
        fetchImpl,
      },
    );

    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.provider_message_id).toBe("unit-test-apns");
    }
    expect(captured.url).toBe("https://api.sandbox.push.apple.com/3/device/abc123");
    expect(captured.authPrefix).toBe("bearer eyJ");
    const parsed = JSON.parse(captured.body ?? "{}") as { aps: { alert: { title: string } }; offer_id: string };
    expect(parsed.aps.alert.title).toBe("Hi");
    expect(parsed.offer_id).toBe("x");
  });
});
