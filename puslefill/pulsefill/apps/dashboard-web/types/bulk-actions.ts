export type BulkSlotActionKind = "retry_offers" | "expire";

export type BulkSlotActionItemResult = {
  open_slot_id: string;
  status: "processed" | "skipped" | "failed";
  code?: string;
  message?: string;
};

export type BulkSlotActionResponse = {
  ok: true;
  action: BulkSlotActionKind;
  summary: {
    requested: number;
    processed: number;
    skipped: number;
    failed: number;
  };
  results: BulkSlotActionItemResult[];
  message: string;
};
