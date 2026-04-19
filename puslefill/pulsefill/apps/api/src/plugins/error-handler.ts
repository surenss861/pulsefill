import fp from "fastify-plugin";
import type { FastifyError, FastifyInstance } from "fastify";

export default fp(async (app: FastifyInstance) => {
  app.setErrorHandler((err: FastifyError | Error, _req, reply) => {
    if (reply.sent) return;
    const statusCode = "statusCode" in err && err.statusCode ? err.statusCode : 500;
    app.log.error({ err }, "request error");
    return reply.status(statusCode).send({
      error: statusCode >= 500 ? "internal_error" : "request_error",
      message: statusCode >= 500 ? "Something went wrong" : err.message,
    });
  });
});
