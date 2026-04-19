import Foundation

struct OfferInboxResponse: Decodable {
    let offers: [OfferInboxItem]
}

struct OfferInboxItem: Decodable, Identifiable {
    let id: String
    let openSlotId: String
    let customerId: String?
    let channel: String
    let status: String
    let sentAt: String?
    let expiresAt: String?
    let openSlot: OpenSlotSummary?
}

struct OpenSlotSummary: Decodable {
    let id: String
    let providerNameSnapshot: String?
    let startsAt: String
    let endsAt: String
    let estimatedValueCents: Int?
    let notes: String?
    let status: String
}

struct ClaimOpenSlotResponse: Decodable {
    let ok: Bool
    let claimId: String?
    let claim: ClaimSummary?
}

struct ClaimSummary: Decodable {
    let id: String?
    let openSlotId: String?
    let customerId: String?
    let status: String?
}

struct SessionSyncResponse: Decodable {
    let ok: Bool?
    let synced: Bool?
    let customerId: String?
}

struct EmptyJSON: Encodable {}
