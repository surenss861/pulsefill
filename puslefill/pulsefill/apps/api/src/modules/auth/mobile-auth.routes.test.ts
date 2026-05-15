import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { buildApp } from "../../app.js";
import { createTestEnv } from "../../test/helpers/env.js";

describe("POST /v1/mobile/auth/sign-in", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  before(async () => {
    app = await buildApp(createTestEnv());
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  it("returns 400 VALIDATION_ERROR for malformed email (before Supabase)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/mobile/auth/sign-in",
      payload: { email: "not-an-email", password: "secret12345" },
    });
    assert.equal(res.statusCode, 400);
    const body = res.json() as { error: { code: string; request_id?: string } };
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.ok(body.error.request_id);
  });

  it("returns 400 VALIDATION_ERROR for empty password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/mobile/auth/sign-in",
      payload: { email: "ok@example.com", password: "" },
    });
    assert.equal(res.statusCode, 400);
    const body = res.json() as { error: { code: string } };
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });
});

describe("POST /v1/mobile/auth/sign-out", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  before(async () => {
    app = await buildApp(createTestEnv());
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  it("returns 401 without Authorization", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/mobile/auth/sign-out",
    });
    assert.equal(res.statusCode, 401);
    const body = res.json() as { error: { code: string } };
    assert.equal(body.error.code, "UNAUTHORIZED");
  });
});
