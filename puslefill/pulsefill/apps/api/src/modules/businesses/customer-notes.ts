import type { SupabaseClient } from "@supabase/supabase-js";

import { customerBelongsToStaffBusiness } from "./operator-customer-context.js";

/** Parse optional `follow_up_at` from JSON; returns ISO string or null. Throws for invalid non-empty input. */
export function parseCustomerNoteFollowUpAt(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "string") {
    throw new Error("customer_notes_invalid_follow_up_at");
  }
  const s = raw.trim();
  if (!s) return null;
  const t = Date.parse(s);
  if (Number.isNaN(t)) {
    throw new Error("customer_notes_invalid_follow_up_at");
  }
  return new Date(t).toISOString();
}

export type CustomerNoteRow = {
  id: string;
  body: string;
  created_at: string;
  follow_up_at: string | null;
  follow_up_completed_at: string | null;
  created_by: { name: string };
};

export type CustomerNotesListResponse = {
  customer_id: string;
  notes: CustomerNoteRow[];
};

export type CustomerNoteCreateResponse = {
  note: CustomerNoteRow;
};

let listCustomerNotesTestDelegate:
  | null
  | ((args: { businessId: string; customerId: string }) => Promise<CustomerNotesListResponse>) = null;

let createCustomerNoteTestDelegate:
  | null
  | ((args: {
      businessId: string;
      customerId: string;
      staffId: string;
      body: string;
      follow_up_at: string | null;
    }) => Promise<CustomerNoteCreateResponse>) = null;

let completeCustomerNoteFollowUpTestDelegate:
  | null
  | ((args: {
      businessId: string;
      customerId: string;
      noteId: string;
    }) => Promise<CustomerNoteCreateResponse>) = null;

export function setListCustomerNotesTestDelegate(
  delegate: ((args: { businessId: string; customerId: string }) => Promise<CustomerNotesListResponse>) | null,
): void {
  if (delegate != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("customer notes list test delegate only when PULSEFILL_API_TEST=1");
  }
  listCustomerNotesTestDelegate = delegate;
}

export function setCreateCustomerNoteTestDelegate(
  delegate:
    | ((args: {
        businessId: string;
        customerId: string;
        staffId: string;
        body: string;
        follow_up_at: string | null;
      }) => Promise<CustomerNoteCreateResponse>)
    | null,
): void {
  if (delegate != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("customer notes create test delegate only when PULSEFILL_API_TEST=1");
  }
  createCustomerNoteTestDelegate = delegate;
}

export function setCompleteCustomerNoteFollowUpTestDelegate(
  delegate:
    | ((args: { businessId: string; customerId: string; noteId: string }) => Promise<CustomerNoteCreateResponse>) | null,
): void {
  if (delegate != null && process.env.PULSEFILL_API_TEST !== "1") {
    throw new Error("customer notes complete follow-up test delegate only when PULSEFILL_API_TEST=1");
  }
  completeCustomerNoteFollowUpTestDelegate = delegate;
}

function staffDisplayName(rel: unknown): string {
  if (!rel) return "Staff member";
  const o = Array.isArray(rel) ? rel[0] : rel;
  if (o && typeof o === "object" && "full_name" in o) {
    const n = String((o as { full_name?: string | null }).full_name ?? "").trim();
    if (n) return n;
  }
  return "Staff member";
}

type NoteRowRaw = {
  id: string;
  body: string;
  created_at: string;
  follow_up_at?: string | null;
  follow_up_completed_at?: string | null;
  staff_users?: { full_name?: string | null } | { full_name?: string | null }[] | null;
};

function mapNoteRow(raw: NoteRowRaw): CustomerNoteRow {
  return {
    id: raw.id,
    body: raw.body,
    created_at: raw.created_at,
    follow_up_at: raw.follow_up_at ?? null,
    follow_up_completed_at: raw.follow_up_completed_at ?? null,
    created_by: { name: staffDisplayName(raw.staff_users) },
  };
}

export async function listCustomerNotes(
  admin: SupabaseClient,
  businessId: string,
  customerId: string,
): Promise<CustomerNotesListResponse> {
  if (listCustomerNotesTestDelegate) {
    return listCustomerNotesTestDelegate({ businessId, customerId });
  }

  const allowed = await customerBelongsToStaffBusiness(admin, businessId, customerId);
  if (!allowed) {
    throw new Error("customer_notes_not_found");
  }

  const { data, error } = await admin
    .from("customer_notes")
    .select("id, body, created_at, follow_up_at, follow_up_completed_at, staff_users ( full_name )")
    .eq("business_id", businessId)
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error("customer_notes_list_failed");

  const notes = (data ?? []).map((row) => mapNoteRow(row as NoteRowRaw));

  return { customer_id: customerId, notes };
}

export async function createCustomerNote(
  admin: SupabaseClient,
  businessId: string,
  customerId: string,
  staffId: string,
  body: string,
  follow_up_at: string | null,
): Promise<CustomerNoteCreateResponse> {
  if (createCustomerNoteTestDelegate) {
    return createCustomerNoteTestDelegate({ businessId, customerId, staffId, body, follow_up_at });
  }

  const allowed = await customerBelongsToStaffBusiness(admin, businessId, customerId);
  if (!allowed) {
    throw new Error("customer_notes_not_found");
  }

  const insertRow: Record<string, unknown> = {
    business_id: businessId,
    customer_id: customerId,
    body,
    created_by_staff_id: staffId,
  };
  if (follow_up_at != null) {
    insertRow.follow_up_at = follow_up_at;
  }

  const { data, error } = await admin
    .from("customer_notes")
    .insert(insertRow)
    .select("id, body, created_at, follow_up_at, follow_up_completed_at, staff_users ( full_name )")
    .single();

  if (error) throw new Error("customer_notes_create_failed");

  return {
    note: mapNoteRow(data as NoteRowRaw),
  };
}

export async function completeCustomerNoteFollowUp(
  admin: SupabaseClient,
  businessId: string,
  customerId: string,
  noteId: string,
): Promise<CustomerNoteCreateResponse> {
  if (completeCustomerNoteFollowUpTestDelegate) {
    return completeCustomerNoteFollowUpTestDelegate({ businessId, customerId, noteId });
  }

  const allowed = await customerBelongsToStaffBusiness(admin, businessId, customerId);
  if (!allowed) {
    throw new Error("customer_notes_not_found");
  }

  const { data: existing, error: loadErr } = await admin
    .from("customer_notes")
    .select("id, follow_up_at, follow_up_completed_at")
    .eq("id", noteId)
    .eq("business_id", businessId)
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .maybeSingle();

  if (loadErr) throw new Error("customer_notes_complete_failed");
  if (!existing) {
    throw new Error("customer_notes_not_found");
  }

  const ex = existing as { follow_up_at: string | null; follow_up_completed_at: string | null };
  if (!ex.follow_up_at) {
    throw new Error("customer_notes_no_follow_up");
  }

  if (ex.follow_up_completed_at) {
    const { data: row, error: rErr } = await admin
      .from("customer_notes")
      .select("id, body, created_at, follow_up_at, follow_up_completed_at, staff_users ( full_name )")
      .eq("id", noteId)
      .single();
    if (rErr || !row) throw new Error("customer_notes_complete_failed");
    return { note: mapNoteRow(row as NoteRowRaw) };
  }

  const { error: upErr } = await admin
    .from("customer_notes")
    .update({ follow_up_completed_at: new Date().toISOString() })
    .eq("id", noteId)
    .eq("business_id", businessId)
    .eq("customer_id", customerId);

  if (upErr) throw new Error("customer_notes_complete_failed");

  const { data: row, error: rErr } = await admin
    .from("customer_notes")
    .select("id, body, created_at, follow_up_at, follow_up_completed_at, staff_users ( full_name )")
    .eq("id", noteId)
    .single();

  if (rErr || !row) throw new Error("customer_notes_complete_failed");

  return { note: mapNoteRow(row as NoteRowRaw) };
}
