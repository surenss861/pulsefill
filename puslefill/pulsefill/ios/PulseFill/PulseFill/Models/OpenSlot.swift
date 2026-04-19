import Foundation

struct OpenSlot: Codable, Identifiable {
    let id: String
    let businessId: String
    let startsAt: String
    let endsAt: String
    let status: String
    let estimatedValueCents: Int?

    enum CodingKeys: String, CodingKey {
        case id, status
        case businessId = "business_id"
        case startsAt = "starts_at"
        case endsAt = "ends_at"
        case estimatedValueCents = "estimated_value_cents"
    }
}
