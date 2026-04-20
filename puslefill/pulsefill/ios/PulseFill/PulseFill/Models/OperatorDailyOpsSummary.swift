import Foundation

struct OperatorDailyOpsSummaryResponse: Codable {
    let date: String
    let timezone: String
    let metrics: OperatorDailyOpsMetrics
    let breakdown: OperatorDailyOpsBreakdown?
}

struct OperatorDailyOpsMetrics: Codable {
    let recoveredBookingsToday: Int
    let recoveredRevenueCentsToday: Int
    let awaitingConfirmationCount: Int
    let deliveryFailuresToday: Int
    let noMatchesToday: Int
    let activeOfferedSlotsCount: Int

    enum CodingKeys: String, CodingKey {
        case recoveredBookingsToday = "recovered_bookings_today"
        case recoveredRevenueCentsToday = "recovered_revenue_cents_today"
        case awaitingConfirmationCount = "awaiting_confirmation_count"
        case deliveryFailuresToday = "delivery_failures_today"
        case noMatchesToday = "no_matches_today"
        case activeOfferedSlotsCount = "active_offered_slots_count"
    }
}

struct OperatorDailyOpsBreakdown: Codable {
    let byStatus: [String: Int]?

    enum CodingKeys: String, CodingKey {
        case byStatus = "by_status"
    }
}
