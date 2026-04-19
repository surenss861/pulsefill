import Foundation

struct SlotClaim: Codable, Identifiable {
    let id: String
    let openSlotId: String
    let customerId: String
    let status: String

    enum CodingKeys: String, CodingKey {
        case id, status
        case openSlotId = "open_slot_id"
        case customerId = "customer_id"
    }
}
