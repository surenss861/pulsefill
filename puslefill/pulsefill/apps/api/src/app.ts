import Fastify from "fastify";
import cors from "@fastify/cors";
import type { Env } from "./config/env.js";
import errorHandler from "./plugins/error-handler.js";
import authPlugin from "./plugins/auth.js";
import { registerRoutes } from "./routes/index.js";

export async function buildApp(env: Env) {
  const app = Fastify({
    logger:
      env.NODE_ENV === "development"
        ? {
            level: env.LOG_LEVEL,
            transport: {
              target: "pino-pretty",
              options: { translateTime: "HH:MM:ss Z", ignore: "pid,hostname" },
            },
          }
        : { level: env.LOG_LEVEL },
  });

  app.decorate("env", env);

  await app.register(errorHandler);
  await app.register(cors, { origin: true });
  await app.register(authPlugin, { env });
  await registerRoutes(app);

  return app;
}

