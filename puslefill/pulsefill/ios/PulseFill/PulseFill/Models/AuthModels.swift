import Foundation

struct AuthMeResponse: Decodable {
    struct User: Decodable {
        let id: String
        let email: String?
    }

    let user: User
}
