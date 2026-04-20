"use client";

import { useCallback, useMemo, useState } from "react";

export function useBulkSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const isSelected = useCallback((id: string) => selectedSet.has(id), [selectedSet]);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleAll = useCallback((visibleIds: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = visibleIds.length > 0 && visibleIds.every((id) => next.has(id));
      if (allSelected) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return Array.from(next);
    });
  }, []);

  const clear = useCallback(() => setSelectedIds([]), []);

  return { selectedIds, selectedSet, isSelected, toggle, toggleAll, clear };
}
