import Foundation

struct Location: Codable, Identifiable {
    let id: String
    let businessId: String
    let name: String
    let city: String?

    enum CodingKeys: String, CodingKey {
        case id, name, city
        case businessId = "business_id"
    }
}
