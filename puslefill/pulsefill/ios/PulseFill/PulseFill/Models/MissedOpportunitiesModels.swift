import Foundation

struct MissedOpportunitiesResponse: Decodable {
    let summary: MissedOpportunitiesSummary
    let items: [MissedOpportunityItem]
}

struct MissedOpportunitiesSummary: Decodable, Hashable {
    let missedLast7Days: Int
    let topReason: String?
    let notificationsLikelyHelped: Bool
}

struct MissedOpportunityItem: Decodable, Identifiable, Hashable {
    let id: String
    let openSlotId: String?
    let offerId: String?
    let businessName: String?
    let serviceName: String?
    let locationName: String?
    let providerName: String?
    let startsAt: String?
    let endsAt: String?
    let missedAt: String?
    let reasonCode: String
    let reasonTitle: String
    let reasonDetail: String?
    let guidance: [MissedOpportunityGuidanceItem]
}

struct MissedOpportunityGuidanceItem: Decodable, Hashable {
    let code: String
    let title: String
    let tone: String
}
