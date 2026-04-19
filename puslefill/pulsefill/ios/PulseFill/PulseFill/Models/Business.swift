import Foundation

struct Business: Codable, Identifiable {
    let id: String
    let name: String
    let slug: String
    let category: String?
    let timezone: String
}
