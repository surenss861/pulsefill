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
    /// Present when the directory API returns per-customer state (membership, request, standby prefs).
    let customerRelationship: CustomerRelationshipState?
}

struct CustomerRelationshipState: Codable, Equatable {
    let membershipStatus: String
    let requestStatus: String
    let standbyStatus: String
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

struct StandbyIntentRequestRecord: Codable {
    let id: String
    let status: String
    let requestedAt: String?
}

struct StandbyIntentResponse: Decodable {
    let result: String
    let outcome: String?
    let membershipStatus: String
    let requestStatus: String
    let nextStep: String
    let request: StandbyIntentRequestRecord?

    enum CodingKeys: String, CodingKey {
        case result
        case outcome
        case membershipStatus
        case requestStatus
        case nextStep
        case request
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        outcome = try c.decodeIfPresent(String.self, forKey: .outcome)
        let decodedResult = try c.decodeIfPresent(String.self, forKey: .result)
        result = decodedResult ?? Self.resultFromLegacyOutcome(outcome)

        membershipStatus = try c.decodeIfPresent(String.self, forKey: .membershipStatus) ?? "none"
        requestStatus = try c.decodeIfPresent(String.self, forKey: .requestStatus) ?? "none"
        nextStep = try c.decodeIfPresent(String.self, forKey: .nextStep)
            ?? Self.nextStepFromLegacy(outcome: outcome, result: decodedResult ?? result)
        request = try c.decodeIfPresent(StandbyIntentRequestRecord.self, forKey: .request)
    }

    private static func resultFromLegacyOutcome(_ outcome: String?) -> String {
        switch outcome {
        case "joined_standby", "already_connected":
            return "joined"
        case "request_submitted", "request_pending":
            return "request_pending"
        case "invite_required":
            return "invite_required"
        default:
            return "joined"
        }
    }

    private static func nextStepFromLegacy(outcome: String?, result: String) -> String {
        if result == "invite_required" { return "enter_invite" }
        if result == "request_pending" { return "wait_for_approval" }
        switch outcome {
        case "already_connected":
            return "edit_preferences"
        case "joined_standby":
            return "setup_standby"
        default:
            return "setup_standby"
        }
    }
}
