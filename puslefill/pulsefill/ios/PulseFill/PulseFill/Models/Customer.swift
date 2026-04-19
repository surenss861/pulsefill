import Foundation

struct Customer: Codable, Identifiable {
    let id: String
    let fullName: String?
    let email: String?

    enum CodingKeys: String, CodingKey {
        case id, email
        case fullName = "full_name"
    }
}
