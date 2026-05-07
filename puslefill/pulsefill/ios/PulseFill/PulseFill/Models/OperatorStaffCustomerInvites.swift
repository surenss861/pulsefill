import Foundation

// MARK: - `/v1/businesses/mine/customer-invites`

struct StaffCustomerInvitesListResponse: Decodable {
    let invites: [StaffCustomerInviteListItemDTO]
}

struct InviteOnboardingStatusDTO: Decodable, Hashable {
    let key: String
    let label: String
    let detail: String
    let tone: String
    let nextAction: InviteNextActionDTO?

    enum CodingKeys: String, CodingKey {
        case key
        case label
        case detail
        case tone
        case nextAction = "next_action"
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        if let raw = try c.decodeIfPresent(String.self, forKey: .key) {
            let t = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            key = t.isEmpty ? "unknown" : t
        } else {
            key = "unknown"
        }
        if let raw = try c.decodeIfPresent(String.self, forKey: .label) {
            let t = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            label = t.isEmpty ? "Status unavailable" : t
        } else {
            label = "Status unavailable"
        }
        if let raw = try c.decodeIfPresent(String.self, forKey: .detail) {
            detail = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        } else {
            detail = ""
        }
        if let raw = try c.decodeIfPresent(String.self, forKey: .tone) {
            let t = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            tone = t.isEmpty ? "neutral" : t
        } else {
            tone = "neutral"
        }
        nextAction = try c.decodeIfPresent(InviteNextActionDTO.self, forKey: .nextAction)
    }
}

struct InviteNextActionDTO: Decodable, Hashable {
    let label: String
    let href: String?

    enum CodingKeys: String, CodingKey {
        case label
        case href
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        label = (try c.decodeIfPresent(String.self, forKey: .label)).map { raw in
            let t = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            return t
        } ?? ""
        href = try c.decodeIfPresent(String.self, forKey: .href)
    }
}

struct StaffCustomerInviteListItemDTO: Decodable, Identifiable, Hashable {
    let id: String
    let code: String?
    let inviteUrl: String?
    let customerName: String?
    let customerEmail: String
    let status: String
    let acceptedByCustomerId: String?
    let createdAt: String
    let expiresAt: String
    let acceptedAt: String?
    let onboardingStatus: InviteOnboardingStatusDTO
    /// Present on create-response payloads only.
    let oneTimeToken: String?
    let expiresInDays: Int?

    enum CodingKeys: String, CodingKey {
        case id
        case code
        case inviteUrl = "invite_url"
        case customerName = "customer_name"
        case customerEmail = "customer_email"
        case status
        case acceptedByCustomerId = "accepted_by_customer_id"
        case createdAt = "created_at"
        case expiresAt = "expires_at"
        case acceptedAt = "accepted_at"
        case onboardingStatus = "onboarding_status"
        case oneTimeToken = "one_time_token"
        case expiresInDays = "expires_in_days"
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        code = try c.decodeIfPresent(String.self, forKey: .code)
        inviteUrl = try c.decodeIfPresent(String.self, forKey: .inviteUrl)
        customerName = try c.decodeIfPresent(String.self, forKey: .customerName)
        customerEmail = (try c.decodeIfPresent(String.self, forKey: .customerEmail))?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if let raw = try c.decodeIfPresent(String.self, forKey: .status) {
            let t = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            status = t.isEmpty ? "unknown" : t
        } else {
            status = "unknown"
        }
        acceptedByCustomerId = try c.decodeIfPresent(String.self, forKey: .acceptedByCustomerId)
        createdAt = try c.decodeIfPresent(String.self, forKey: .createdAt) ?? ""
        expiresAt = try c.decodeIfPresent(String.self, forKey: .expiresAt) ?? ""
        acceptedAt = try c.decodeIfPresent(String.self, forKey: .acceptedAt)

        if let o = try? c.decode(InviteOnboardingStatusDTO.self, forKey: .onboardingStatus) {
            onboardingStatus = o
        } else {
            onboardingStatus = InviteOnboardingStatusDTO.fallbackDecoded
        }

        oneTimeToken = try c.decodeIfPresent(String.self, forKey: .oneTimeToken)
        expiresInDays = try c.decodeIfPresent(Int.self, forKey: .expiresInDays)
    }
}

private extension InviteOnboardingStatusDTO {
    /// Used when `onboarding_status` is absent or malformed.
    static let fallbackDecoded = InviteOnboardingStatusDTO(
        key: "unknown",
        label: "Status unavailable",
        detail: "",
        tone: "neutral",
        nextAction: nil
    )

    init(key: String, label: String, detail: String, tone: String, nextAction: InviteNextActionDTO?) {
        self.key = key
        self.label = label
        self.detail = detail
        self.tone = tone
        self.nextAction = nextAction
    }
}

/// Shared request body (`POST` create invite).
struct CreateStaffCustomerInviteBody: Encodable {
    let email: String
    let customerName: String?

    enum ValidationError: LocalizedError {
        case invalidEmail

        var errorDescription: String? {
            switch self {
            case .invalidEmail:
                return "Enter a valid email address."
            }
        }
    }

    init(trimmedEmail: String, customerName: String?) throws {
        let e = trimmedEmail.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard e.contains("@"), e.count >= 3 else { throw ValidationError.invalidEmail }
        email = e
        let n = customerName?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        self.customerName = n.isEmpty ? nil : n
    }
}

/// Revoke `{ invite: {...} }`
struct RevokeStaffCustomerInviteResponseDTO: Decodable {
    let invite: StaffCustomerInviteListItemDTO
}

// MARK: - Reusable operator summary (invite row + enrich later from `/context`)

struct OperatorSafeCustomerBrief: Identifiable, Hashable {
    var id: String
    /// Title line shown to staff.
    let title: String
    let subtitleLines: [String]
    /// When known (accepted invite), navigable customer id for `/customers/:id/context`.
    let contextCustomerId: String?

    static func titleFrom(invite row: StaffCustomerInviteListItemDTO) -> OperatorSafeCustomerBrief {
        let cid = row.acceptedByCustomerId
        let head: String
        if let n = row.customerName?.trimmingCharacters(in: .whitespacesAndNewlines), !n.isEmpty {
            head = n
        } else {
            head = row.customerEmail
        }
        let subLines = uniqueNonEmptyStrings([row.customerEmail, row.onboardingStatus.label])
        return OperatorSafeCustomerBrief(
            id: cid ?? row.id,
            title: head,
            subtitleLines: subLines,
            contextCustomerId: cid
        )
    }

    private static func uniqueNonEmptyStrings(_ values: [String]) -> [String] {
        var seen = Set<String>()
        var out: [String] = []
        for v in values {
            let t = v.trimmingCharacters(in: .whitespacesAndNewlines)
            if t.isEmpty { continue }
            if seen.contains(t) { continue }
            seen.insert(t)
            out.append(t)
        }
        return out
    }
}
