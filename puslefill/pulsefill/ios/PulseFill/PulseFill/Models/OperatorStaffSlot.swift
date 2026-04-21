import Foundation

// MARK: - GET /v1/open-slots/:id

struct OpenSlotDetailAPIResponse: Codable {
    let slot: StaffOpenSlotDetail
    let queueContext: OperatorSlotQueueContext?
    let availableActions: [OperatorSlotAvailableAction]?
}

struct SimpleOkResponse: Decodable {
    let ok: Bool?
}

struct StaffTouchRow: Codable, Hashable {
    let id: String
    let fullName: String?
    let email: String?
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
    /// Staff-only; not shown to customers.
    let internalNote: String?
    let resolutionStatus: String?
    let internalNoteUpdatedAt: String?
    let lastTouchedAt: String?
    let lastTouchedByStaffId: String?
    let lastTouchedBy: StaffTouchRow?
}

extension StaffOpenSlotDetail {
    func applyingSavedNote(_ res: UpdateOperatorSlotNoteResponse) -> StaffOpenSlotDetail {
        StaffOpenSlotDetail(
            id: id,
            status: status,
            providerNameSnapshot: providerNameSnapshot,
            serviceId: serviceId,
            locationId: locationId,
            notes: notes,
            startsAt: startsAt,
            endsAt: endsAt,
            estimatedValueCents: estimatedValueCents,
            winningClaim: winningClaim,
            slotOffers: slotOffers,
            internalNote: res.internalNote,
            resolutionStatus: res.resolutionStatus,
            internalNoteUpdatedAt: res.internalNoteUpdatedAt,
            lastTouchedAt: lastTouchedAt,
            lastTouchedByStaffId: lastTouchedByStaffId,
            lastTouchedBy: lastTouchedBy
        )
    }
}

struct UpdateOperatorSlotNoteResponse: Decodable {
    let ok: Bool
    let openSlotId: String
    let internalNote: String?
    let resolutionStatus: String
    let internalNoteUpdatedAt: String?
    let message: String
}

struct UpdateOperatorSlotNoteBody: Encodable {
    var internalNote: String
    var resolutionStatus: String
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
    let providerId: String?
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
    let actorType: String?
    let actorId: String?
    let eventType: String
    let createdAt: String
    let actorLabel: String?
}

struct NotificationLogsAPIResponse: Codable {
    let logs: [OperatorNotificationLogRow]
}

struct OperatorNotificationLogRow: Codable, Identifiable, Hashable {
    let id: String
    let status: String
    let customerId: String?
    let error: String?
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

struct ConfirmOpenSlotResponse: Decodable {
    let ok: Bool?
    let result: String?
    let openSlotId: String?
    let claimId: String?
    let status: String?
    let message: String?
}

struct SendOffersAPIResponse: Decodable {
    let ok: Bool?
    /// e.g. offers_sent, offers_retried, no_matches
    let result: String?
    let matched: Int?
    let offerIds: [String]?
    let message: String?
    let notificationQueue: NotificationQueueInfo?

    enum CodingKeys: String, CodingKey {
        case ok
        case result
        case matched
        case offerIds = "offer_ids"
        case message
        case notificationQueue = "notification_queue"
    }
}

struct NotificationQueueInfo: Decodable {
    let queued: Bool?
    let count: Int?
}
