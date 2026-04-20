import Foundation

// MARK: - GET /v1/businesses/mine/ops-breakdown

struct OperatorOpsBreakdownResponse: Codable {
    let dateRange: OperatorOpsDateRange
    let providers: [OperatorOpsBreakdownRow]
    let services: [OperatorOpsBreakdownRow]
    let locations: [OperatorOpsBreakdownRow]
    let highlights: OperatorOpsHighlights

    enum CodingKeys: String, CodingKey {
        case dateRange = "date_range"
        case providers
        case services
        case locations
        case highlights
    }
}

struct OperatorOpsDateRange: Codable {
    let label: String
    let startAt: String
    let endAt: String

    enum CodingKeys: String, CodingKey {
        case label
        case startAt = "start_at"
        case endAt = "end_at"
    }
}

struct OperatorOpsBreakdownRow: Codable, Identifiable, Hashable {
    let id: String
    let label: String
    let recoveredBookings: Int
    let recoveredRevenueCents: Int
    let awaitingConfirmation: Int
    let activeOfferedSlots: Int
    let deliveryFailures: Int
    let noMatches: Int

    enum CodingKeys: String, CodingKey {
        case id
        case label
        case recoveredBookings = "recovered_bookings"
        case recoveredRevenueCents = "recovered_revenue_cents"
        case awaitingConfirmation = "awaiting_confirmation"
        case activeOfferedSlots = "active_offered_slots"
        case deliveryFailures = "delivery_failures"
        case noMatches = "no_matches"
    }
}

struct OperatorOpsHighlights: Codable {
    let topProviderByRecoveredBookings: String?
    let topServiceByNoMatches: String?
    let topLocationByFailures: String?

    enum CodingKeys: String, CodingKey {
        case topProviderByRecoveredBookings = "top_provider_by_recovered_bookings"
        case topServiceByNoMatches = "top_service_by_no_matches"
        case topLocationByFailures = "top_location_by_failures"
    }
}

// MARK: - GET /v1/businesses/mine/delivery-reliability

struct OperatorDeliveryReliabilityResponse: Codable {
    let date: String
    let timezone: String
    let summary: OperatorDeliveryReliabilitySummary
    let highlights: OperatorDeliveryReliabilityHighlights
}

struct OperatorDeliveryReliabilitySummary: Codable {
    let deliveredToday: Int
    let failedToday: Int
    let simulatedToday: Int
    let customersWithPushReady: Int
    let customersWithNoPushDevice: Int
    let customersWithNoReachableChannel: Int

    enum CodingKeys: String, CodingKey {
        case deliveredToday = "delivered_today"
        case failedToday = "failed_today"
        case simulatedToday = "simulated_today"
        case customersWithPushReady = "customers_with_push_ready"
        case customersWithNoPushDevice = "customers_with_no_push_device"
        case customersWithNoReachableChannel = "customers_with_no_reachable_channel"
    }
}

struct OperatorDeliveryReliabilityHighlights: Codable {
    let topFailureReason: String?
    let customersWithRepeatedFailures: Int?
    let slotsAffectedToday: Int?

    enum CodingKeys: String, CodingKey {
        case topFailureReason = "top_failure_reason"
        case customersWithRepeatedFailures = "customers_with_repeated_failures"
        case slotsAffectedToday = "slots_affected_today"
    }
}

struct BusinessNamedRow: Codable {
    let id: String
    let name: String
}
