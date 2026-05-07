import Foundation

/// `GET /v1/auth/me` — identity plus PulseFill role capabilities for dual-mode routing.
struct PulseFillAuthMeResponse: Codable, Sendable {
    struct AuthUser: Codable, Sendable {
        let id: String
        let email: String?
    }

    struct Roles: Codable, Sendable {
        let customer: Bool
        let staff: Bool
    }

    struct Customer: Codable, Sendable {
        let id: String
    }

    struct StaffBusiness: Codable, Sendable {
        let businessId: String
        let businessName: String
        let role: String
    }

    struct Staff: Codable, Sendable {
        let businesses: [StaffBusiness]
    }

    let user: AuthUser
    let roles: Roles
    let customer: Customer?
    let staff: Staff?
}
