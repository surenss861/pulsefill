import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createServiceSupabase } from "../../config/supabase.js";
import { sendJson } from "../../lib/http-errors.js";
import { requireStaff } from "../../plugins/guards.js";
import { rateLimitTier } from "../../plugins/rate-limit.js";
import { buildActionQueue, neutralActionQueueResponse } from "./action-queue.js";
import { buildDailyOpsSummary, neutralDailyOpsSummary } from "./daily-ops-summary.js";
import { buildDeliveryReliability } from "./delivery-reliability.js";
import { buildOpsBreakdown } from "./ops-breakdown.js";
import { buildMorningRecoveryDigest } from "./morning-recovery-digest.js";
import { buildOperatorActivityFeed } from "./activity-feed.js";
import {
  completeCustomerNoteFollowUp,
  createCustomerNote,
  listCustomerNotes,
  parseCustomerNoteFollowUpAt,
} from "./customer-notes.js";
import { buildCustomerProfile } from "./customer-profile.js";
import { buildCustomerTimeline } from "./customer-timeline.js";
import { buildOperatorCustomerContext } from "./operator-customer-context.js";
import { buildOutcomesPage } from "./outcomes-page.js";
import { buildRecoveryHealth } from "./recovery-health.js";
import { buildRecoveryInsights, type RecoveryInsightsResponse } from "./recovery-insights.js";
import { buildServiceCoverageDrilldown, type ServiceCoverageDrilldownResponse } from "./service-coverage-drilldown.js";
import { buildStandbyCoverage } from "./standby-coverage.js";



let buildOutcomesPageTestDelegate:
  | null
  | ((admin: ReturnType<typeof createServiceSupabase>, businessId: string) => Promise<unknown>) = null;

export function setBuildOutcomesPageTestDelegate(
  delegate: ((admin: ReturnType<typeof createServiceSupabase>, businessId: string) => Promise<unknown>) | null,
) {
  buildOutcomesPageTestDelegate = delegate;
}

let buildRecoveryInsightsTestDelegate:
  | null
  | ((admin: ReturnType<typeof createServiceSupabase>, businessId: string) => Promise<RecoveryInsightsResponse>) = null;

export function setBuildRecoveryInsightsTestDelegate(
  delegate:
    | ((admin: ReturnType<typeof createServiceSupabase>, businessId: string) => Promise<RecoveryInsightsResponse>)
    | null,
) {
  buildRecoveryInsightsTestDelegate = delegate;
}

let buildServiceCoverageDrilldownTestDelegate:
  | null
  | ((
      admin: ReturnType<typeof createServiceSupabase>,
      businessId: string,
      serviceId: string,
    ) => Promise<ServiceCoverageDrilldownResponse>) = null;

export function setBuildServiceCoverageDrilldownTestDelegate(
  delegate:
    | ((
        admin: ReturnType<typeof createServiceSupabase>,
        businessId: string,
        serviceId: string,
      ) => Promise<ServiceCoverageDrilldownResponse>)
    | null,
) {
  buildServiceCoverageDrilldownTestDelegate = delegate;
}

type NotificationAttemptFilterInput = {
  status?: "queued" | "suppressed" | "sent" | "failed";
  type?: string;
  open_slot_id?: string;
  customer_id?: string;
  limit: number;
};

let listNotificationAttemptsTestDelegate:
  | null
  | ((args: { businessId: string; filters: NotificationAttemptFilterInput }) => Promise<{ items: unknown[] }>) = null;

export function setListNotificationAttemptsTestDelegate(
  delegate:
    | ((args: { businessId: string; filters: NotificationAttemptFilterInput }) => Promise<{ items: unknown[] }>)
    | null,
) {
  listNotificationAttemptsTestDelegate = delegate;
}

const patchBody = z
  .object({
    name: z.string().min(1).max(200).optional(),
    category: z.string().max(120).optional(),
    timezone: z.string().min(1).max(80).optional(),
    phone: z.string().max(40).optional(),
    email: z.string().email().optional(),
    website: z.string().max(512).optional(),
    standby_access_mode: z.enum(["private", "request_to_join", "public"]).optional(),
    customer_discovery_enabled: z.boolean().optional(),
  })
  .strict();

export async function registerBusinessRoutes(app: FastifyInstance) {
  app.get(
    "/v1/businesses/mine/notification-attempts",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const filters = z
        .object({
          status: z.enum(["queued", "suppressed", "sent", "failed"]).optional(),
          type: z.string().min(1).max(120).optional(),
          open_slot_id: z.string().uuid().optional(),
          customer_id: z.string().uuid().optional(),
          limit: z.coerce.number().int().min(1).max(200).default(50),
        })
        .parse((req.query as Record<string, string | undefined>) ?? {});

      try {
        if (listNotificationAttemptsTestDelegate) {
          const out = await listNotificationAttemptsTestDelegate({
            businessId: req.staff!.business_id,
            filters,
          });
          return reply.send(out);
        }

        let query = admin
          .from("notification_delivery_attempts")
          .select(
            "id, type, status, decision, suppression_reason, retryable, dedupe_key, open_slot_id, customer_id, claim_id, provider, error_code, error_message, created_at, updated_at",
          )
          .eq("business_id", req.staff!.business_id)
          .order("created_at", { ascending: false })
          .limit(filters.limit);

        if (filters.status) query = query.eq("status", filters.status);
        if (filters.type) query = query.eq("type", filters.type);
        if (filters.open_slot_id) query = query.eq("open_slot_id", filters.open_slot_id);
        if (filters.customer_id) query = query.eq("customer_id", filters.customer_id);

        const { data, error } = await query;
        if (error) {
          req.log.error({ error }, "notification attempts failed");
          return sendJson(req, reply, 500, { error: "notification_attempts_failed" });
        }
        return reply.send({ items: data ?? [] });
      } catch (e) {
        req.log.error({ e }, "notification attempts failed");
        return sendJson(req, reply, 500, { error: "notification_attempts_failed" });
      }
    },
  );

  app.get(
    "/v1/businesses/mine",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const { data, error } = await admin
        .from("businesses")
        .select("*")
        .eq("id", req.staff!.business_id)
        .maybeSingle();

      if (error) {
        return sendJson(req, reply, 500, { error: "business_lookup_failed" });
      }
      if (!data) {
        return sendJson(req, reply, 404, { error: "business_not_found" });
      }
      return reply.send(data);
    },
  );

  app.get(
    "/v1/businesses/mine/metrics",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const businessId = req.staff!.business_id;
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [slots, booked, revenue, slotRows] = await Promise.all([
        admin
          .from("open_slots")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .gte("created_at", since),
        admin
          .from("open_slots")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .eq("status", "booked")
          .gte("created_at", since),
        admin
          .from("open_slots")
          .select("estimated_value_cents")
          .eq("business_id", businessId)
          .eq("status", "booked")
          .gte("created_at", since),
        admin.from("open_slots").select("id").eq("business_id", businessId).gte("created_at", since),
      ]);

      const slotIds = (slotRows.data ?? []).map((r) => r.id);
      let offersCount = 0;
      if (slotIds.length > 0) {
        const { count } = await admin
          .from("slot_offers")
          .select("id", { count: "exact", head: true })
          .in("open_slot_id", slotIds)
          .gte("sent_at", since);
        offersCount = count ?? 0;
      }

      const recoveredRevenueCents =
        revenue.data?.reduce((acc, r) => acc + (r.estimated_value_cents ?? 0), 0) ?? 0;

      return reply.send({
        window_days: 30,
        open_slots_created: slots.count ?? 0,
        offers_sent: offersCount,
        slots_booked: booked.count ?? 0,
        recovered_revenue_cents: recoveredRevenueCents,
      });
    },
  );

  app.get(
    "/v1/businesses/mine/activity-feed",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      try {
        const data = await buildOperatorActivityFeed(admin, req.staff!.business_id);
        return reply.send(data);
      } catch (e) {
        req.log.error({ e }, "operator_activity_feed_failed");
        return sendJson(req, reply, 500, { error: "operator_activity_feed_failed" });
      }
    },
  );

  app.get(
    "/v1/businesses/mine/action-queue",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      try {
        const data = await buildActionQueue(admin, req.staff!.business_id);
        return reply.send(data);
      } catch (e) {
        req.log.error({ e }, "action_queue_failed");
        return reply.send(neutralActionQueueResponse());
      }
    },
  );

  app.get(
    "/v1/businesses/mine/morning-recovery-digest",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      try {
        const data = await buildMorningRecoveryDigest(admin, req.staff!.business_id);
        return reply.send(data);
      } catch (e) {
        req.log.error({ e }, "morning_recovery_digest_failed");
        return sendJson(req, reply, 500, { error: "morning_recovery_digest_failed" });
      }
    },
  );

  app.get(
    "/v1/businesses/mine/daily-ops-summary",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      try {
        const data = await buildDailyOpsSummary(admin, req.staff!.business_id);
        return reply.send(data);
      } catch (e) {
        req.log.error({ e }, "daily_ops_summary_failed");
        return reply.send(neutralDailyOpsSummary());
      }
    },
  );

  app.get(
    "/v1/businesses/mine/ops-breakdown",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      try {
        const data = await buildOpsBreakdown(admin, req.staff!.business_id);
        return reply.send(data);
      } catch (e) {
        req.log.error({ e }, "ops_breakdown_failed");
        return sendJson(req, reply, 500, { error: "ops_breakdown_failed" });
      }
    },
  );

  app.get(
    "/v1/businesses/mine/outcomes",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      try {
        const data = buildOutcomesPageTestDelegate
          ? await buildOutcomesPageTestDelegate(admin, req.staff!.business_id)
          : await buildOutcomesPage(admin, req.staff!.business_id);
        return reply.send(data);
      } catch (e) {
        req.log.error({ e }, "outcomes_page_failed");
        return sendJson(req, reply, 500, { error: "outcomes_page_failed" });
      }
    },
  );

  app.get(
    "/v1/businesses/mine/recovery-health",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.directoryRead } },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      try {
        const data = await buildRecoveryHealth(admin, req.staff!.business_id);
        return reply.send(data);
      } catch (e) {
        req.log.error({ e }, "recovery_health_failed");
        return sendJson(req, reply, 500, { error: "recovery_health_failed" });
      }
    },
  );

  app.get(
    "/v1/businesses/mine/recovery-insights",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.directoryRead } },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      try {
        const data = buildRecoveryInsightsTestDelegate
          ? await buildRecoveryInsightsTestDelegate(admin, req.staff!.business_id)
          : await buildRecoveryInsights(admin, req.staff!.business_id);
        return reply.send(data);
      } catch (e) {
        req.log.error({ e }, "recovery_insights_failed");
        return sendJson(req, reply, 500, { error: "recovery_insights_failed" });
      }
    },
  );

  app.get(
    "/v1/businesses/mine/standby-coverage",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.directoryRead } },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      try {
        const data = await buildStandbyCoverage(admin, req.staff!.business_id);
        return reply.send(data);
      } catch (e) {
        req.log.error({ e }, "standby_coverage_failed");
        return sendJson(req, reply, 500, { error: "standby_coverage_failed" });
      }
    },
  );

  app.get(
    "/v1/businesses/mine/service-coverage/:serviceId",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.directoryRead } },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const parsed = z.string().uuid().safeParse((req.params as { serviceId?: string }).serviceId);
      if (!parsed.success) {
        return sendJson(req, reply, 400, { error: "invalid_service_id" });
      }
      const serviceId = parsed.data;
      try {
        const data = buildServiceCoverageDrilldownTestDelegate
          ? await buildServiceCoverageDrilldownTestDelegate(admin, req.staff!.business_id, serviceId)
          : await buildServiceCoverageDrilldown(admin, req.staff!.business_id, serviceId);
        return reply.send(data);
      } catch (e) {
        if (e instanceof Error && e.message === "service_not_found") {
          return sendJson(req, reply, 404, { error: "service_not_found" });
        }
        req.log.error({ e }, "service_coverage_drilldown_failed");
        return sendJson(req, reply, 500, { error: "service_coverage_drilldown_failed" });
      }
    },
  );

  app.get(
    "/v1/businesses/mine/delivery-reliability",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      try {
        const data = await buildDeliveryReliability(admin, req.staff!.business_id);
        return reply.send(data);
      } catch (e) {
        req.log.error({ e }, "delivery_reliability_failed");
        return sendJson(req, reply, 500, { error: "delivery_reliability_failed" });
      }
    },
  );

  app.get(
    "/v1/businesses/mine/customers/:customerId/profile",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.directoryRead } },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const parsed = z.string().uuid().safeParse((req.params as { customerId?: string }).customerId);
      if (!parsed.success) {
        return sendJson(req, reply, 400, { error: "invalid_customer_id" });
      }
      const customerId = parsed.data;
      try {
        const data = await buildCustomerProfile(admin, req.staff!.business_id, customerId);
        return reply.send(data);
      } catch (e) {
        if (e instanceof Error && e.message === "customer_profile_not_found") {
          return sendJson(req, reply, 404, { error: "not_found" });
        }
        req.log.error({ e }, "customer_profile_failed");
        return sendJson(req, reply, 500, { error: "customer_profile_failed" });
      }
    },
  );

  app.get(
    "/v1/businesses/mine/customers/:customerId/timeline",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.directoryRead } },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const parsed = z.string().uuid().safeParse((req.params as { customerId?: string }).customerId);
      if (!parsed.success) {
        return sendJson(req, reply, 400, { error: "invalid_customer_id" });
      }
      const customerId = parsed.data;
      try {
        const data = await buildCustomerTimeline(admin, req.staff!.business_id, customerId);
        return reply.send(data);
      } catch (e) {
        if (e instanceof Error && e.message === "customer_timeline_not_found") {
          return sendJson(req, reply, 404, { error: "not_found" });
        }
        req.log.error({ e }, "customer_timeline_failed");
        return sendJson(req, reply, 500, { error: "customer_timeline_failed" });
      }
    },
  );

  const postCustomerNoteBody = z
    .object({
      body: z.string(),
      follow_up_at: z.string().optional(),
    })
    .strict();

  app.get(
    "/v1/businesses/mine/customers/:customerId/notes",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.directoryRead } },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const parsed = z.string().uuid().safeParse((req.params as { customerId?: string }).customerId);
      if (!parsed.success) {
        return sendJson(req, reply, 400, { error: "invalid_customer_id" });
      }
      const customerId = parsed.data;
      try {
        const data = await listCustomerNotes(admin, req.staff!.business_id, customerId);
        return reply.send(data);
      } catch (e) {
        if (e instanceof Error && e.message === "customer_notes_not_found") {
          return sendJson(req, reply, 404, { error: "not_found" });
        }
        req.log.error({ e }, "customer_notes_list_failed");
        return sendJson(req, reply, 500, { error: "customer_notes_list_failed" });
      }
    },
  );

  app.post(
    "/v1/businesses/mine/customers/:customerId/notes",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const parsed = z.string().uuid().safeParse((req.params as { customerId?: string }).customerId);
      if (!parsed.success) {
        return sendJson(req, reply, 400, { error: "invalid_customer_id" });
      }
      const customerId = parsed.data;

      let bodyRaw: string;
      let followUpRaw: string | undefined;
      try {
        const parsed = postCustomerNoteBody.parse(req.body ?? {});
        bodyRaw = parsed.body;
        followUpRaw = parsed.follow_up_at;
      } catch {
        return sendJson(req, reply, 400, { error: "validation_error", message: "Invalid request body." });
      }
      const body = bodyRaw.trim();
      if (!body) {
        return sendJson(req, reply, 400, { error: "validation_error", message: "Note body cannot be empty." });
      }
      if (body.length > 2000) {
        return sendJson(req, reply, 400, { error: "validation_error", message: "Note body must be at most 2000 characters." });
      }

      let followUpIso: string | null;
      try {
        followUpIso = parseCustomerNoteFollowUpAt(followUpRaw);
      } catch {
        return sendJson(req, reply, 400, { error: "validation_error", message: "Invalid follow_up_at date." });
      }

      try {
        const data = await createCustomerNote(
          admin,
          req.staff!.business_id,
          customerId,
          req.staff!.id,
          body,
          followUpIso,
        );
        return reply.status(201).send(data);
      } catch (e) {
        if (e instanceof Error && e.message === "customer_notes_not_found") {
          return sendJson(req, reply, 404, { error: "not_found" });
        }
        req.log.error({ e }, "customer_notes_create_failed");
        return sendJson(req, reply, 500, { error: "customer_notes_create_failed" });
      }
    },
  );

  app.post(
    "/v1/businesses/mine/customers/:customerId/notes/:noteId/complete-follow-up",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const customerParsed = z.string().uuid().safeParse((req.params as { customerId?: string }).customerId);
      const noteParsed = z.string().uuid().safeParse((req.params as { noteId?: string }).noteId);
      if (!customerParsed.success) {
        return sendJson(req, reply, 400, { error: "invalid_customer_id" });
      }
      if (!noteParsed.success) {
        return sendJson(req, reply, 400, { error: "invalid_note_id" });
      }
      const customerId = customerParsed.data;
      const noteId = noteParsed.data;

      try {
        const data = await completeCustomerNoteFollowUp(admin, req.staff!.business_id, customerId, noteId);
        return reply.send(data);
      } catch (e) {
        if (e instanceof Error && e.message === "customer_notes_not_found") {
          return sendJson(req, reply, 404, { error: "not_found" });
        }
        if (e instanceof Error && e.message === "customer_notes_no_follow_up") {
          return sendJson(req, reply, 400, {
            error: "validation_error",
            message: "This note does not have a follow-up reminder.",
          });
        }
        req.log.error({ e }, "customer_notes_complete_failed");
        return sendJson(req, reply, 500, { error: "customer_notes_complete_failed" });
      }
    },
  );

  app.get(
    "/v1/businesses/mine/customers/:customerId/context",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const customerId = z.string().uuid().parse((req.params as { customerId?: string }).customerId);

      try {
        const result = await buildOperatorCustomerContext(admin, req.staff!.business_id, customerId);
        if ("error" in result) {
          if (result.error === "not_found") {
            return sendJson(req, reply, 404, { error: "customer_not_found" });
          }
          return sendJson(req, reply, 403, { error: "customer_context_forbidden" });
        }
        return reply.send(result);
      } catch (e) {
        req.log.error({ e }, "operator_customer_context_failed");
        return sendJson(req, reply, 500, { error: "operator_customer_context_failed" });
      }
    },
  );

  app.get(
    "/v1/businesses/mine/live-counts",
    { preHandler: requireStaff },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const businessId = req.staff!.business_id;

      const { data, error } = await admin.from("open_slots").select("status").eq("business_id", businessId);

      if (error) {
        req.log.error({ error }, "live counts failed");
        return sendJson(req, reply, 500, { error: "live_counts_failed" });
      }

      const rows = data ?? [];
      const claimedCount = rows.filter((row) => row.status === "claimed").length;
      const openCount = rows.filter((row) => row.status === "open" || row.status === "offered").length;

      return reply.send({
        counts: {
          claimed: claimedCount,
          open: openCount,
        },
      });
    },
  );

  app.patch(
    "/v1/businesses/mine",
    { preHandler: requireStaff, config: { rateLimit: rateLimitTier.staffAction } },
    async (req, reply) => {
      const admin = createServiceSupabase(req.server.env);
      const body = patchBody.parse(req.body ?? {});

      const { data, error } = await admin
        .from("businesses")
        .update(body)
        .eq("id", req.staff!.business_id)
        .select("*")
        .maybeSingle();

      if (error) {
        return sendJson(req, reply, 500, { error: "business_update_failed" });
      }
      return reply.send(data);
    },
  );
}
