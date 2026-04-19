import Foundation

// MARK: - GET /v1/open-slots/:id

struct OpenSlotDetailAPIResponse: Codable {
    let slot: StaffOpenSlotDetail
}

struct StaffOpenSlotDetail: Codable {
    let id: String
    let status: String
    let providerNameSnapshot: String?
    let serviceId: String?
    let locationId: String?
    let notes: String?
    let startsAt: String
    let endsAt: String
    let estimatedValueCents: Int?
    let winningClaim: WinningClaimRow?
    let slotOffers: [StaffSlotOfferRow]?
}

struct WinningClaimRow: Codable, Hashable {
    let id: String
    let customerId: String
    let claimedAt: String?
    let status: String
}

struct StaffSlotOfferRow: Codable, Identifiable, Hashable {
    let id: String
    let customerId: String
    let status: String
    let sentAt: String?
    let expiresAt: String?
}

// MARK: - GET /v1/open-slots (list)

struct OpenSlotsListAPIResponse: Codable {
    let openSlots: [StaffOpenSlotListRow]
}

struct StaffOpenSlotListRow: Codable, Identifiable {
    let id: String
    let status: String
    let startsAt: String
    let endsAt: String
    let providerNameSnapshot: String?
    let serviceId: String?
    let locationId: String?
    let winningClaim: WinningClaimRow?
}

// MARK: - Timeline & notification logs

struct TimelineAPIResponse: Codable {
    let events: [OperatorTimelineEvent]
}

struct OperatorTimelineEvent: Codable, Identifiable, Hashable {
    let id: String
    let eventType: String
    let createdAt: String
}

struct NotificationLogsAPIResponse: Codable {
    let logs: [OperatorNotificationLogRow]
}

struct OperatorNotificationLogRow: Codable, Identifiable, Hashable {
    let id: String
    let status: String
    let customerId: String?
    let createdAt: String
}

// MARK: - POST bodies / responses

struct SendOffersRequest: Encodable {
    var offerTtlSeconds: Int = 300
    var channel: String = "push"
}

struct ConfirmClaimRequest: Encodable {
    let claimId: String
}

struct OkResponse: Decodable {
    let ok: Bool
}

struct SendOffersAPIResponse: Decodable {
    let ok: Bool?
    let matched: Int?
    let message: String?
}
