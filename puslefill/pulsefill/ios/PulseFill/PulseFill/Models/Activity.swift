import Foundation

struct ActivityResponse: Decodable {
    let activity: [ActivityItemDTO]
}

struct ActivityItemDTO: Decodable, Identifiable {
    let id: String
    let openSlotId: String
    let claimedAt: String?
    let status: String
    let openSlot: OpenSlotActivitySummary?
}

struct OpenSlotActivitySummary: Decodable {
    let id: String
    let providerNameSnapshot: String?
    let startsAt: String
    let endsAt: String
    let estimatedValueCents: Int?
    let status: String
}
