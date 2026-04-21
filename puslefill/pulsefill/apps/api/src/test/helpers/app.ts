/**
 * Route-test helpers: auth header + opt-in staff bypass header (see `guards.ts`).
 * Used with `PULSEFILL_API_TEST=1` and `buildApp(createTestEnv())`.
 */

export const ROUTE_TEST_AUTH_TOKEN = "test-token";

export function authHeader(token: string = ROUTE_TEST_AUTH_TOKEN) {
  return { authorization: `Bearer ${token}` };
}

/** Enables test-only staff resolution when `PULSEFILL_API_TEST=1`. */
export function routeTestHeaders(token: string = ROUTE_TEST_AUTH_TOKEN) {
  return {
    ...authHeader(token),
    "x-pulsefill-route-test": "1",
  };
}
