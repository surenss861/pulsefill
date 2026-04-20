"use client";

import { useCallback, useMemo, useState } from "react";
import type { OperatorActivityItem } from "@/types/operator-activity-feed";

export function useOperatorActivityBulkSelection(items: OperatorActivityItem[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectableItems = useMemo(
    () => items.filter((item) => item.bulk_selectable && item.open_slot_id),
    [items],
  );

  const selectedItems = useMemo(
    () => selectableItems.filter((item) => selectedIds.includes(item.id)),
    [selectableItems, selectedIds],
  );

  const selectedSlotIds = useMemo(
    () =>
      Array.from(
        new Set(
          selectedItems.map((item) => item.open_slot_id).filter((id): id is string => Boolean(id)),
        ),
      ),
    [selectedItems],
  );

  const toggle = useCallback((id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }, []);

  const clear = useCallback(() => setSelectedIds([]), []);

  const selectAllVisible = useCallback(() => {
    setSelectedIds(selectableItems.map((item) => item.id));
  }, [selectableItems]);

  return {
    selectedIds,
    selectedItems,
    selectedSlotIds,
    toggle,
    clear,
    selectAllVisible,
    hasSelection: selectedIds.length > 0,
  };
}
