export type PushDevicePlatform = "ios" | "android" | "web";
export type PushDeviceTokenType = "apns" | "expo";

export type ActivePushDevice = {
  token: string;
  platform: PushDevicePlatform;
  token_type: PushDeviceTokenType;
  active: true;
};

type PushDeviceRow = {
  customer_id: string;
  device_token: string | null;
  platform: PushDevicePlatform;
  token_type: PushDeviceTokenType;
  active: boolean;
  last_seen_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type QueryResult = {
  data: PushDeviceRow[] | null;
  error: { code?: string; message?: string } | null;
};

type QueryBuilder = {
  eq: (field: string, value: string | boolean) => QueryBuilder;
  order: (field: string, opts?: { ascending?: boolean }) => QueryBuilder;
  limit: (count: number) => Promise<QueryResult>;
};

export type SupabaseClientLike = {
  from: (table: string) => {
    select: (fields: string) => QueryBuilder;
  };
};

function recencyMs(row: PushDeviceRow): number {
  const preferred = row.last_seen_at ?? row.updated_at ?? row.created_at ?? "";
  const ts = Date.parse(preferred);
  return Number.isNaN(ts) ? -1 : ts;
}

export function pickBestActivePushDevice(rows: PushDeviceRow[]): ActivePushDevice | null {
  const eligible = rows
    .filter((row) => row.active)
    .filter((row) => (row.device_token ?? "").trim().length > 0)
    .sort((a, b) => recencyMs(b) - recencyMs(a));

  const winner = eligible[0];
  if (!winner) return null;
  return {
    token: (winner.device_token ?? "").trim(),
    platform: winner.platform,
    token_type: winner.token_type,
    active: true,
  };
}

export async function getActivePushDeviceForCustomer(input: {
  supabase: SupabaseClientLike;
  customerId: string;
  platform?: PushDevicePlatform;
  tokenType?: PushDeviceTokenType;
}): Promise<ActivePushDevice | null> {
  let query = input.supabase
    .from("customer_push_devices")
    .select("customer_id, device_token, platform, token_type, active, last_seen_at, updated_at, created_at")
    .eq("customer_id", input.customerId)
    .eq("active", true);

  if (input.platform) {
    query = query.eq("platform", input.platform);
  }
  if (input.tokenType) {
    query = query.eq("token_type", input.tokenType);
  }

  const { data, error } = await query
    .order("last_seen_at", { ascending: false })
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    const code = String(error.code ?? "unknown");
    throw new Error(`active_push_device_lookup_failed:${code}`);
  }

  return pickBestActivePushDevice((data ?? []) as PushDeviceRow[]);
}
