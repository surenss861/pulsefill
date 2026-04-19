import Foundation

struct Service: Codable, Identifiable {
    let id: String
    let businessId: String
    let name: String
    let durationMinutes: Int
    let active: Bool

    enum CodingKeys: String, CodingKey {
        case id, name, active
        case businessId = "business_id"
        case durationMinutes = "duration_minutes"
    }
}
