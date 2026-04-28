import Foundation

struct AuthMeResponse: Decodable {
    struct User: Decodable {
        let id: String
        let email: String?
    }

    let user: User
}

struct AcceptInviteRequest: Encodable {
    let token: String
}

struct AcceptInviteResponse: Decodable {
    let accepted: Bool
    let businessId: String
    let customerId: String
    let needsStandbySetup: Bool
}
