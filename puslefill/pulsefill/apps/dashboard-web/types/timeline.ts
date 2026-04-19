export type SlotTimelineEvent = {
  id: string;
  actor_type: string;
  actor_id?: string | null;
  event_type: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};
