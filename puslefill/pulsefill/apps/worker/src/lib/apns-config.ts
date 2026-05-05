import type { ApnsHttpConfig, ApnsHttpEnvironment } from "@pulsefill/shared";

export type WorkerApnsSecrets = Pick<ApnsHttpConfig, "teamId" | "keyId" | "privateKey" | "bundleId">;

/** Same env contract as the API (`provider-factory.ts`). Returns null if push is noop or APNS secrets incomplete. */
export function readWorkerApnsSecrets(): WorkerApnsSecrets | null {
  if (process.env.PUSH_PROVIDER?.trim() !== "apns") return null;
  const teamId = process.env.APNS_TEAM_ID?.trim() ?? "";
  const keyId = process.env.APNS_KEY_ID?.trim() ?? "";
  const privateKey = process.env.APNS_PRIVATE_KEY?.trim() ?? "";
  const bundleId = process.env.APNS_BUNDLE_ID?.trim() ?? "";
  if (!teamId || !keyId || !privateKey || !bundleId) return null;
  return { teamId, keyId, privateKey, bundleId };
}

/** `customer_push_devices.environment` is `development` | `production` (app build tier). */
export function apnsHostEnvForDeviceRow(deviceEnv: string | null | undefined): ApnsHttpEnvironment {
  const e = (deviceEnv ?? "").toLowerCase();
  return e === "production" ? "production" : "sandbox";
}
