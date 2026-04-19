export type NotificationChannel = "push" | "sms" | "email";

export type SendOfferNotificationJobPayload = {
  offerId: string;
  openSlotId: string;
  customerId: string;
  channel: NotificationChannel;
};
