import Foundation

struct CustomerOfferDetailResponse: Decodable {
    let offer: CustomerOfferDetail
}

struct CustomerOfferDetail: Decodable, Identifiable, Hashable {
    let id: String
    let status: String
    let expiresAt: String?
    let sentAt: String?
    let openSlotId: String?
    let businessName: String?
    let serviceName: String?
    let locationName: String?
    let providerName: String?
    let startsAt: String?
    let endsAt: String?
    let matchedPreference: MatchedPreferenceSummary?
    let claimGuidance: OfferClaimGuidance?
}

struct MatchedPreferenceSummary: Decodable, Hashable {
    let id: String
    let businessName: String?
    let serviceName: String?
    let providerName: String?
    let locationName: String?
}

struct OfferClaimGuidance: Decodable, Hashable {
    let title: String
    let detail: String?
}
