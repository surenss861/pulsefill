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
};
