import Foundation

struct StandbyStatusResponse: Codable {
    let summary: StandbyStatusSummary
    let notificationReadiness: StandbyNotificationReadiness
    let recentActivity: StandbyRecentActivity
    let preferences: [StandbyStatusPreferenceRow]
    let guidance: [StandbyGuidanceItem]
}

struct StandbyStatusSummary: Codable, Hashable {
    let activePreferences: Int
    let pausedPreferences: Int
    let businessesCovered: Int
    let hasAnyActivePreference: Bool
}

struct StandbyNotificationReadiness: Codable, Hashable {
    let pushPermissionStatus: String
    let hasPushDevice: Bool
    let hasEmail: Bool
    let hasSms: Bool
    let hasAnyReachableChannel: Bool
}

struct StandbyRecentActivity: Codable, Hashable {
    let recentOffers: Int
    let recentClaims: Int
    let recentMissed: Int
    let windowDays: Int
}

struct StandbyStatusPreferenceRow: Codable, Hashable, Identifiable {
    let id: String
    let active: Bool
    let businessName: String?
    let serviceName: String?
    let locationName: String?
    let providerName: String?
    let maxNoticeHours: Int?
}

struct StandbyGuidanceItem: Codable, Hashable, Identifiable {
    var id: String { code }

    let code: String
    let title: String
    let tone: String
}
