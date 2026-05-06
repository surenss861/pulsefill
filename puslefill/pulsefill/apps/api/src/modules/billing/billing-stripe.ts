import Stripe from "stripe";
import type { Env } from "../../config/env.js";

export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
}

export function stripeClientFromEnv(env: Env): Stripe | null {
  const key = env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return createStripeClient(key);
}
