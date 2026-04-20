import type { OperatorFiltersState, SavedOperatorView } from "@/types/operator-filters";

export const DEFAULT_OPERATOR_FILTERS: OperatorFiltersState = {
  providerId: null,
  locationId: null,
  serviceId: null,
};

export function matchesOperatorFilters<T extends {
  provider_id?: string | null;
  location_id?: string | null;
  service_id?: string | null;
}>(item: T, filters: OperatorFiltersState) {
  if (filters.providerId && item.provider_id !== filters.providerId) return false;
  if (filters.locationId && item.location_id !== filters.locationId) return false;
  if (filters.serviceId && item.service_id !== filters.serviceId) return false;
  return true;
}

export function loadSavedOperatorFilters(storageKey: string): OperatorFiltersState {
  if (typeof window === "undefined") return DEFAULT_OPERATOR_FILTERS;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return DEFAULT_OPERATOR_FILTERS;
    return { ...DEFAULT_OPERATOR_FILTERS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_OPERATOR_FILTERS;
  }
}

export function persistOperatorFilters(storageKey: string, filters: OperatorFiltersState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(filters));
}

export function loadSavedOperatorViews(storageKey: string): SavedOperatorView[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    return JSON.parse(raw) as SavedOperatorView[];
  } catch {
    return [];
  }
}

export function persistSavedOperatorViews(storageKey: string, views: SavedOperatorView[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(views));
}
