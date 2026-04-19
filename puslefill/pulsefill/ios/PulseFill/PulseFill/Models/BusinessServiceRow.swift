import Foundation

/// Active services for a business from `GET /v1/customers/me/business-services`.
struct BusinessServiceRow: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let durationMinutes: Int?
    let priceCents: Int?
    let active: Bool?
}
