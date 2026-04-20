"use client";

import { useEffect, useState } from "react";
import type { OperatorFiltersState, SavedOperatorView } from "@/types/operator-filters";
import {
  DEFAULT_OPERATOR_FILTERS,
  loadSavedOperatorFilters,
  loadSavedOperatorViews,
  persistOperatorFilters,
  persistSavedOperatorViews,
} from "@/lib/operator-filters";

export function useOperatorFilters(args: { filtersStorageKey: string; viewsStorageKey: string }) {
  const { filtersStorageKey, viewsStorageKey } = args;

  const [filters, setFilters] = useState<OperatorFiltersState>(DEFAULT_OPERATOR_FILTERS);
  const [views, setViews] = useState<SavedOperatorView[]>([]);

  useEffect(() => {
    setFilters(loadSavedOperatorFilters(filtersStorageKey));
    setViews(loadSavedOperatorViews(viewsStorageKey));
  }, [filtersStorageKey, viewsStorageKey]);

  useEffect(() => {
    persistOperatorFilters(filtersStorageKey, filters);
  }, [filtersStorageKey, filters]);

  useEffect(() => {
    persistSavedOperatorViews(viewsStorageKey, views);
  }, [viewsStorageKey, views]);

  function createView(name: string) {
    const next: SavedOperatorView = {
      id: crypto.randomUUID(),
      name,
      filters,
      createdAt: new Date().toISOString(),
    };
    setViews((prev) => [next, ...prev]);
  }

  function deleteView(id: string) {
    setViews((prev) => prev.filter((view) => view.id !== id));
  }

  return {
    filters,
    setFilters,
    views,
    createView,
    deleteView,
  };
}
