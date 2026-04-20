import Foundation

struct ClaimOutcomeResponse: Decodable {
    let claim: ClaimOutcomeClaim
    let outcome: ClaimOutcomeSummary
    let nextSteps: [ClaimOutcomeNextStep]
}

struct ClaimOutcomeClaim: Decodable, Hashable {
    let id: String
    let status: String
    let openSlotId: String?
    let offerId: String?
    let businessName: String?
    let serviceName: String?
    let locationName: String?
    let providerName: String?
    let startsAt: String?
    let endsAt: String?
}

struct ClaimOutcomeSummary: Decodable, Hashable {
    let state: String
    let title: String
    let detail: String?
}

struct ClaimOutcomeNextStep: Decodable, Hashable {
    let code: String
    let title: String
}
