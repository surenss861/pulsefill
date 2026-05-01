import fp from "fastify-plugin";
import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

const HEADER = "x-request-id";
const MAX_INCOMING_LEN = 128;

function sanitizeIncoming(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const v = raw.trim().slice(0, MAX_INCOMING_LEN);
  // Allow UUIDs and common tracing tokens (alnum, dash, underscore).
  if (!/^[\w-]+$/.test(v)) return null;
  return v;
}

export default fp(async (app: FastifyInstance) => {
  app.addHook("onRequest", async (req: FastifyRequest, reply: FastifyReply) => {
    const incoming = sanitizeIncoming(req.headers[HEADER] as string | undefined);
    const id = incoming ?? randomUUID();
    req.requestId = id;
    void reply.header(HEADER, id);
  });
});
