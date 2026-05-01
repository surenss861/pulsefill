import assert from "node:assert/strict";
import test, { after, before } from "node:test";

import Fastify from "fastify";
import type { FastifyRequest } from "fastify";
import rateLimit from "@fastify/rate-limit";

let app: ReturnType<typeof Fastify>;

before(async () => {
  app = Fastify();
  await app.register(rateLimit, {
    global: false,
    max: 2,
    timeWindow: 60_000,
    hook: "onRequest",
    keyGenerator: () => "test-key",
    errorResponseBuilder: (request: FastifyRequest) => ({
      statusCode: 429,
      error: "rate_limited",
      message: "Too many attempts.",
      request_id: (request as { requestId?: string }).requestId ?? "n/a",
    }),
  });

  app.get(
    "/hit",
    {
      preHandler: app.rateLimit(),
    },
    async () => ({ ok: true }),
  );

  await app.ready();
});

after(async () => {
  await app.close();
});

test("rate limit returns 429 with error rate_limited after max", async () => {
  const a = await app.inject({ method: "GET", url: "/hit" });
  const b = await app.inject({ method: "GET", url: "/hit" });
  const c = await app.inject({ method: "GET", url: "/hit" });
  assert.equal(a.statusCode, 200);
  assert.equal(b.statusCode, 200);
  assert.equal(c.statusCode, 429);
  const body = c.json() as { error: string; statusCode?: number };
  assert.equal(body.error, "rate_limited");
});
