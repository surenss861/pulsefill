import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

function pathOnly(url: string): string {
  const i = url.indexOf("?");
  return i === -1 ? url : url.slice(0, i);
}

/**
 * One log line per finished request for Railway / log drains:
 * `POST /v1/auth/session/sync 200 41ms requestId=…`
 *
 * Registers after `request-id` so `req.requestId` is always set.
 */
export default fp(async (app: FastifyInstance) => {
  app.addHook("onRequest", async (req: FastifyRequest) => {
    req.pfRequestStartNs = process.hrtime.bigint();
  });

  app.addHook("onResponse", async (req: FastifyRequest, reply: FastifyReply) => {
    const start = req.pfRequestStartNs;
    const durationMs =
      start != null ? Math.round(Number(process.hrtime.bigint() - start) / 1e6) : 0;
    const path = pathOnly(req.url);
    const rid = req.requestId;
    app.log.info(`${req.method} ${path} ${reply.statusCode} ${durationMs}ms requestId=${rid}`);
  });
});
