/** Shape returned by `GET /v1/businesses/mine` (business row). */
export type BusinessMineResponse = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  timezone: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  created_at: string;
  /** How customers may join standby (directory + intent APIs). */
  standby_access_mode?: "private" | "request_to_join" | "public";
  /** When true, business is listed in customer directory APIs. */
  customer_discovery_enabled?: boolean;
};
