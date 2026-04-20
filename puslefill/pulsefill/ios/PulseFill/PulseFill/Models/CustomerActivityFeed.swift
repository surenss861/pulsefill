import Foundation

struct CustomerActivityFeedResponse: Decodable {
    let items: [CustomerActivityItem]
}

struct CustomerActivityItem: Decodable, Identifiable, Hashable {
    let id: String
    let kind: String
    let title: String
    let detail: String?
    let occurredAt: String
    let state: String?
    let offerId: String?
    let claimId: String?
    let openSlotId: String?
    let businessName: String?
    let serviceName: String?
    let providerName: String?
    let locationName: String?
    let startsAt: String?
    let endsAt: String?
}
