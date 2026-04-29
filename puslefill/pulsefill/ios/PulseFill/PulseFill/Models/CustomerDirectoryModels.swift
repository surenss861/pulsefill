import Foundation

struct CustomerDirectoryListResponse: Codable {
    let businesses: [CustomerDirectoryBusinessSummary]
}

struct CustomerDirectoryBusinessSummary: Codable, Identifiable {
    let id: String
    let name: String
    let slug: String
    let category: String?
    let timezone: String?
    let standbyAccessMode: String?
    let customerDiscoveryEnabled: Bool?
}

struct CustomerDirectoryBusinessDetailResponse: Codable {
    let business: CustomerDirectoryBusinessRow
    let locations: [CustomerDirectoryLocationRow]
    let services: [CustomerDirectoryServiceRow]
}

struct CustomerDirectoryBusinessRow: Codable {
    let id: String
    let name: String
    let slug: String
    let category: String?
    let timezone: String?
    let phone: String?
    let email: String?
    let website: String?
    let standbyAccessMode: String?
    let customerDiscoveryEnabled: Bool?
}

struct CustomerDirectoryLocationRow: Codable, Identifiable {
    let id: String
    let name: String
    let city: String?
    let region: String?
}

struct CustomerDirectoryServiceRow: Codable, Identifiable {
    let id: String
    let name: String
    let durationMinutes: Int?
    let active: Bool?
}

struct StandbyIntentRequest: Encodable {
    let message: String?
}

struct StandbyIntentResponse: Codable {
    let outcome: String
}
