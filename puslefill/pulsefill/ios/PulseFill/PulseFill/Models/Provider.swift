import Foundation

struct Provider: Codable, Identifiable {
    let id: String
    let businessId: String
    let name: String
    let active: Bool

    enum CodingKeys: String, CodingKey {
        case id, name, active
        case businessId = "business_id"
    }
}
