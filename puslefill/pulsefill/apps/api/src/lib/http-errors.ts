import type { FastifyReply, FastifyRequest } from "fastify";

const DEFAULT_MESSAGES: Record<number, string> = {
  400: "This request could not be processed.",
  401: "Sign in again to continue.",
  403: "You do not have access to this resource.",
  404: "We could not find what you asked for.",
  409: "This action conflicts with the current state.",
  429: "Too many attempts. Try again shortly.",
  500: "Something went wrong. Please try again.",
};

/** Attach `request_id` to JSON error responses (4xx/5xx only). */
export function sendJson<T extends Record<string, unknown>>(
  req: FastifyRequest,
  reply: FastifyReply,
  statusCode: number,
  body: T,
): FastifyReply {
  if (statusCode >= 400) {
    return reply.status(statusCode).send({ ...body, request_id: req.requestId } as T & { request_id: string });
  }
  return reply.status(statusCode).send(body);
}

export function sendPublicError(
  req: FastifyRequest,
  reply: FastifyReply,
  statusCode: number,
  error: string,
  message?: string,
  details?: Record<string, unknown>,
): FastifyReply {
  const payload: Record<string, unknown> = {
    error,
    message: message ?? DEFAULT_MESSAGES[statusCode] ?? DEFAULT_MESSAGES[500]!,
    request_id: req.requestId,
  };
  if (details && Object.keys(details).length > 0) {
    payload.details = details;
  }
  return reply.status(statusCode).send(payload);
}
