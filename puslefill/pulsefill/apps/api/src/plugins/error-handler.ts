import fp from "fastify-plugin";
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

function isProd(env: string | undefined) {
  return env === "production";
}

function mapStatusToError(statusCode: number): string {
  if (statusCode === 401) return "session_required";
  if (statusCode === 403) return "permission_denied";
  if (statusCode === 404) return "not_found";
  if (statusCode === 409) return "conflict";
  if (statusCode === 429) return "rate_limited";
  if (statusCode === 400) return "validation_error";
  return statusCode >= 500 ? "internal_error" : "request_error";
}

export default fp(async (app: FastifyInstance) => {
  app.setErrorHandler((err: FastifyError | Error, req: FastifyRequest, reply: FastifyReply) => {
    if (reply.sent) return;

    const requestId = req.requestId ?? "unknown";
    const prod = isProd(app.env.NODE_ENV);

    let statusCode = 500;
    if ("statusCode" in err && typeof err.statusCode === "number" && err.statusCode) {
      statusCode = err.statusCode;
    }

    if ("validation" in err && Array.isArray((err as FastifyError).validation)) {
      statusCode = 400;
    }

    const logPayload: Record<string, unknown> = {
      err,
      request_id: requestId,
    };
    if (!prod && err instanceof Error && err.stack) {
      logPayload.stack = err.stack;
    }
    app.log.error(logPayload, "request error");

    if (statusCode >= 500) {
      return reply.status(statusCode).send({
        error: "internal_error",
        message: "Something went wrong. Please try again.",
        request_id: requestId,
      });
    }

    const code = mapStatusToError(statusCode);
    const message =
      statusCode === 400 && "validation" in err
        ? "Request validation failed."
        : prod
          ? "This request could not be completed."
          : err.message;

    return reply.status(statusCode).send({
      error: code,
      message,
      request_id: requestId,
    });
  });
});
