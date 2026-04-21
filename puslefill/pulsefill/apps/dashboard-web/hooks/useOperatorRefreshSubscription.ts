"use client";

import { useEffect, useRef } from "react";
import { subscribeOperatorRefreshEvent, type OperatorRefreshDetail } from "@/lib/operator-refresh-events";

type Props = {
  onSlotUpdated?: (detail: OperatorRefreshDetail) => void;
  onSlotNoteUpdated?: (detail: OperatorRefreshDetail) => void;
};

export function useOperatorRefreshSubscription({ onSlotUpdated, onSlotNoteUpdated }: Props) {
  const updatedRef = useRef(onSlotUpdated);
  const noteRef = useRef(onSlotNoteUpdated);
  updatedRef.current = onSlotUpdated;
  noteRef.current = onSlotNoteUpdated;

  useEffect(() => {
    const unsubUpdated = subscribeOperatorRefreshEvent("slot:updated", (detail) => {
      updatedRef.current?.(detail);
    });
    const unsubNote = subscribeOperatorRefreshEvent("slot:note_updated", (detail) => {
      noteRef.current?.(detail);
    });
    return () => {
      unsubUpdated();
      unsubNote();
    };
  }, []);
}
