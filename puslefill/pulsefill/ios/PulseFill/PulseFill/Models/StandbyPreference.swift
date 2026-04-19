import Foundation

/// Matches `standby_preferences` rows from `GET /v1/customers/me/preferences`.
struct StandbyPreference: Codable, Identifiable, Equatable {
    let id: String
    let businessId: String
    let locationId: String?
    let serviceId: String?
    let providerId: String?
    let maxNoticeHours: Int?
    let earliestTime: String?
    let latestTime: String?
    let daysOfWeek: [Int]
    let maxDistanceKm: Int?
    let depositOk: Bool
    let active: Bool
    let createdAt: String?
    let updatedAt: String?
}
