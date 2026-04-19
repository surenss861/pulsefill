"use client";

import { useMemo } from "react";

export type SetupChecklistInput = {
  locationsCount: number;
  providersCount: number;
  servicesCount: number;
  openSlotsCount: number;
  offersSent: number;
  slotsBooked: number;
};

export type SetupChecklistState = {
  hasLocation: boolean;
  hasProvider: boolean;
  hasService: boolean;
  hasOpenSlot: boolean;
  hasOffersSent: boolean;
  hasConfirmedBooking: boolean;
};

export function useSetupChecklistState(input: SetupChecklistInput): SetupChecklistState {
  return useMemo(
    () => ({
      hasLocation: input.locationsCount > 0,
      hasProvider: input.providersCount > 0,
      hasService: input.servicesCount > 0,
      hasOpenSlot: input.openSlotsCount > 0,
      hasOffersSent: input.offersSent > 0,
      hasConfirmedBooking: input.slotsBooked > 0,
    }),
    [
      input.locationsCount,
      input.providersCount,
      input.servicesCount,
      input.openSlotsCount,
      input.offersSent,
      input.slotsBooked,
    ],
  );
}
