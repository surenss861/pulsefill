import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  ActionErrorCode,
  ConfirmSuccessResponse,
  SendOffersSuccessResponse,
} from "./action-response.js";

export function sendActionError(
  req: FastifyRequest,
  reply: FastifyReply,
  statusCode: number,
  code: ActionErrorCode,
  message: string,
  retryable = false,
  details?: Record<string, unknown>,
) {
  return reply.status(statusCode).send({
    request_id: req.requestId,
    error: {
      code,
      message,
      retryable,
      ...(details ? { details } : {}),
    },
  });
}

export function sendConfirmSuccess(reply: FastifyReply, body: ConfirmSuccessResponse) {
  return reply.status(200).send(body);
}

export function sendSendOffersSuccess(reply: FastifyReply, body: SendOffersSuccessResponse) {
  return reply.status(200).send(body);
}
