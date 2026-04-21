import Foundation

/// Mirrors `MorningRecoveryDigestResponse` from dashboard-web / businesses API.
struct MorningRecoveryDigestResponse: Decodable, Equatable {
    let generatedAt: String
    let summary: MorningRecoveryDigestSummary
    let sections: [MorningRecoveryDigestSection]

    enum CodingKeys: String, CodingKey {
        case generatedAt = "generated_at"
        case summary
        case sections
    }
}

struct MorningRecoveryDigestSummary: Decodable, Equatable {
    let retryNowCount: Int
    let quietHoursReadyCount: Int
    let manualFollowUpCount: Int
    let expandMatchPoolCount: Int

    enum CodingKeys: String, CodingKey {
        case retryNowCount = "retry_now_count"
        case quietHoursReadyCount = "quiet_hours_ready_count"
        case manualFollowUpCount = "manual_follow_up_count"
        case expandMatchPoolCount = "expand_match_pool_count"
    }
}

enum MorningRecoveryDigestSectionKind: String, Decodable, Equatable {
    case workFirst = "work_first"
    case manualFollowUp = "manual_follow_up"
    case improveCoverage = "improve_coverage"
    case laterToday = "later_today"
}

struct MorningRecoveryDigestSection: Decodable, Equatable, Identifiable {
    let kind: MorningRecoveryDigestSectionKind
    let title: String
    let detail: String
    let count: Int
    let slotIds: [String]
    let priority: String
    let actionType: String?
    let actionLabel: String?

    var id: String { kind.rawValue }

    enum CodingKeys: String, CodingKey {
        case kind
        case title
        case detail
        case count
        case slotIds = "slot_ids"
        case priority
        case actionType = "action_type"
        case actionLabel = "action_label"
    }
}
