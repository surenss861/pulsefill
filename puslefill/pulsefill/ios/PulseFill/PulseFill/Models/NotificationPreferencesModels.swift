import Foundation

struct NotificationPreferencesResponse: Decodable {
    let preferences: CustomerNotificationPreferences
    let readiness: NotificationReadinessSummary
}

struct CustomerNotificationPreferences: Decodable, Hashable {
    let quietHoursEnabled: Bool
    let quietHoursStartLocal: String?
    let quietHoursEndLocal: String?
    let cadencePreference: String
    let notifyNewOffers: Bool
    let notifyClaimUpdates: Bool
    let notifyBookingConfirmations: Bool
    let notifyStandbyTips: Bool
}

struct NotificationReadinessSummary: Decodable, Hashable {
    let pushPermissionStatus: String
    let hasPushDevice: Bool
}

struct UpdateNotificationPreferencesBody: Encodable {
    let quietHoursEnabled: Bool
    let quietHoursStartLocal: String?
    let quietHoursEndLocal: String?
    let cadencePreference: String
    let notifyNewOffers: Bool
    let notifyClaimUpdates: Bool
    let notifyBookingConfirmations: Bool
    let notifyStandbyTips: Bool
}
