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

    var canClaim: Bool {
        guard let status = offer?.status.lowercased() else { return false }
        guard let slotId = offer?.openSlotId, !slotId.isEmpty else { return false }
        if isExpired { return false }
        return status == "sent" || status == "delivered" || status == "viewed"
    }

    private static func parseISO(_ string: String) -> Date? {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: string) { return d }
        f.formatOptions = [.withInternetDateTime]
        return f.date(from: string)
    }
}
