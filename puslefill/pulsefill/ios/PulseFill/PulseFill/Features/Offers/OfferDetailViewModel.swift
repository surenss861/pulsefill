import Foundation
import Observation

@Observable
@MainActor
final class OfferDetailViewModel {
    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    var loadState: LoadState = .idle
    var offer: CustomerOfferDetail?
    var isClaiming = false
    var flashMessage: String?

    private let api: APIClient
    private let offerId: String

    init(api: APIClient, offerId: String) {
        self.api = api
        self.offerId = offerId
    }

    func load() async {
        if offer == nil { loadState = .loading }
        do {
            let response = try await api.getOfferDetail(offerId: offerId)
            offer = response.offer
            loadState = .loaded
        } catch {
            loadState = .failed(APIErrorCopy.message(for: error))
        }
    }

    func refresh() async {
        await load()
    }

    var isExpired: Bool {
        guard let expiresAt = offer?.expiresAt else { return false }
        guard let exp = Self.parseISO(expiresAt) else { return false }
        return exp.timeIntervalSinceNow <= 0
    }

    var expiresSoon: Bool {
        guard let expiresAt = offer?.expiresAt else { return false }
        guard let exp = Self.parseISO(expiresAt) else { return false }
        let t = exp.timeIntervalSinceNow
        return t > 0 && t <= 15 * 60
    }

    var displayStatus: CustomerOfferDisplayStatus {
        guard let offer else { return .unknown }
        return customerOfferDisplayStatus(forDetail: offer)
    }

    var primaryActionTitle: String {
        if isClaiming { return "Claiming…" }
        switch displayStatus {
        case .readyToClaim, .offerAvailable, .expiresSoon:
            return "Claim opening"
        case .claimed:
            return "Claim submitted"
        case .confirmed:
            return "Booking confirmed"
        case .expired:
            return "Offer expired"
        case .unavailable:
            return "Unavailable"
        case .unknown:
            return "Status pending"
        }
    }

    var canClaim: Bool {
        guard let offer else { return false }
        guard let slotId = offer.openSlotId, !slotId.isEmpty else { return false }
        if isClaiming { return false }
        return displayStatus.isClaimable
    }

    private static func parseISO(_ string: String) -> Date? {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: string) { return d }
        f.formatOptions = [.withInternetDateTime]
        return f.date(from: string)
    }
}
