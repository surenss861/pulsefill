import Foundation

struct OperatorActionQueueResponse: Codable {
    let summary: OperatorActionQueueSummary
    let sections: OperatorActionQueueSections
}

struct OperatorActionQueueSummary: Codable {
    let needsActionCount: Int
    let reviewCount: Int
    let resolvedCount: Int
    let awaitingConfirmationCount: Int
    let deliveryFailedCount: Int
    let retryRecommendedCount: Int
}

struct OperatorActionQueueSections: Codable {
    let needsAction: [OperatorActionQueueItem]
    let review: [OperatorActionQueueItem]
    let resolved: [OperatorActionQueueItem]
}

struct OperatorActionQueueItem: Codable, Identifiable, Hashable {
    let id: String
    let kind: OperatorQueueItemKind
    let severity: OperatorQueueSeverity
    let headline: String
    /// API field `description`
    let detail: String?
    let openSlotId: String
    let slotStatus: String?
    let providerName: String?
    let serviceName: String?
    let locationName: String?
    let customerLabel: String?
    let claimId: String?
    let startsAt: String
    let endsAt: String
    let createdAt: String
    let actions: [OperatorQueueAction]

    enum CodingKeys: String, CodingKey {
        case id, kind, severity, headline
        case detail = "description"
        case openSlotId, slotStatus, providerName, serviceName, locationName
        case customerLabel, claimId, startsAt, endsAt, createdAt, actions
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        kind = try c.decode(OperatorQueueItemKind.self, forKey: .kind)
        severity = try c.decode(OperatorQueueSeverity.self, forKey: .severity)
        headline = try c.decode(String.self, forKey: .headline)
        detail = try c.decodeIfPresent(String.self, forKey: .detail)
        openSlotId = try c.decode(String.self, forKey: .openSlotId)
        slotStatus = try c.decodeIfPresent(String.self, forKey: .slotStatus)
        providerName = try c.decodeIfPresent(String.self, forKey: .providerName)
        serviceName = try c.decodeIfPresent(String.self, forKey: .serviceName)
        locationName = try c.decodeIfPresent(String.self, forKey: .locationName)
        customerLabel = try c.decodeIfPresent(String.self, forKey: .customerLabel)
        claimId = try c.decodeIfPresent(String.self, forKey: .claimId)
        startsAt = try c.decode(String.self, forKey: .startsAt)
        endsAt = try c.decode(String.self, forKey: .endsAt)
        createdAt = try c.decode(String.self, forKey: .createdAt)
        actions = try c.decode([OperatorQueueAction].self, forKey: .actions)
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(kind, forKey: .kind)
        try c.encode(severity, forKey: .severity)
        try c.encode(headline, forKey: .headline)
        try c.encodeIfPresent(detail, forKey: .detail)
        try c.encode(openSlotId, forKey: .openSlotId)
        try c.encodeIfPresent(slotStatus, forKey: .slotStatus)
        try c.encodeIfPresent(providerName, forKey: .providerName)
        try c.encodeIfPresent(serviceName, forKey: .serviceName)
        try c.encodeIfPresent(locationName, forKey: .locationName)
        try c.encodeIfPresent(customerLabel, forKey: .customerLabel)
        try c.encodeIfPresent(claimId, forKey: .claimId)
        try c.encode(startsAt, forKey: .startsAt)
        try c.encode(endsAt, forKey: .endsAt)
        try c.encode(createdAt, forKey: .createdAt)
        try c.encode(actions, forKey: .actions)
    }
}

enum OperatorQueueItemKind: String, Codable, Hashable {
    case awaitingConfirmation = "awaiting_confirmation"
    case deliveryFailed = "delivery_failed"
    case retryRecommended = "retry_recommended"
    case noMatches = "no_matches"
    case offeredActive = "offered_active"
    case expiredUnfilled = "expired_unfilled"
    case confirmedBooking = "confirmed_booking"
}

enum OperatorQueueSeverity: String, Codable, Hashable {
    case high
    case medium
    case low
}

enum OperatorQueueAction: String, Codable, Hashable {
    case confirmBooking = "confirm_booking"
    case inspectLogs = "inspect_logs"
    case retryOffers = "retry_offers"
    case openSlot = "open_slot"
    case viewSlot = "view_slot"
}
