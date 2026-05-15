import "dotenv/config";
import { loadEnv } from "./config/env.js";
import { assertProductionStartup } from "./config/production-readiness.js";
import { buildApp } from "./app.js";

const env = loadEnv();
assertProductionStartup(env);
const app = await buildApp(env);

await app.listen({ port: env.PORT, host: "0.0.0.0" });
