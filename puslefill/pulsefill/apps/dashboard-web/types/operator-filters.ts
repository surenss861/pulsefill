export type OperatorFilterOption = {
  id: string;
  label: string;
};

export type OperatorFiltersState = {
  providerId: string | null;
  locationId: string | null;
  serviceId: string | null;
};

export type SavedOperatorView = {
  id: string;
  name: string;
  filters: OperatorFiltersState;
  createdAt: string;
};
