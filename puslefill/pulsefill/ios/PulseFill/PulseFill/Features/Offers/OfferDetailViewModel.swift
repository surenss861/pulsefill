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
    var successBanner: String?
    var errorBanner: String?
    /// Set after a successful claim so we can link to outcome while the offer payload catches up.
    var lastClaimId: String?

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
            if let offer {
                switch customerOfferDisplayStatus(forDetail: offer) {
                case .confirmed, .expired, .unavailable:
                    lastClaimId = nil
                default:
                    break
                }
            }
        } catch {
            loadState = .failed(PFCustomerFacingErrorCopy.sanitizeCustomerMessage(APIErrorCopy.message(for: error)))
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

    var detailUIState: OfferDetailUIState {
        OfferDetailUIState.resolve(
            displayStatus: displayStatus,
            rawOfferStatus: offer?.status,
            isClaiming: isClaiming,
        )
    }

    var primaryActionTitle: String {
        detailUIState.claimButtonTitle
    }

    var canClaim: Bool {
        guard let offer else { return false }
        guard let slotId = offer.openSlotId, !slotId.isEmpty else { return false }
        if isClaiming { return false }
        return detailUIState.showsClaimButton
    }

    func claimOpening() async {
        guard let offer, let slotId = offer.openSlotId, !slotId.isEmpty else { return }
        guard canClaim else { return }
        isClaiming = true
        errorBanner = nil
        defer { isClaiming = false }
        PFHaptics.mediumImpact()
        do {
            let res = try await api.post(
                "/v1/open-slots/\(slotId)/claim",
                body: EmptyJSON(),
                as: ClaimOpenSlotResponse.self,
            )
            guard res.ok else {
                errorBanner = "This opening could not be claimed right now."
                PFHaptics.warning()
                return
            }
            let id = res.claim?.id ?? res.claimId
            if let id, !id.isEmpty {
                lastClaimId = id
            }
            PFHaptics.success()
            await load()
            if let refreshed = self.offer,
               customerOfferDisplayStatus(forDetail: refreshed) == .claimed
            {
                successBanner = "Claim sent. The business will confirm this opening."
            }
        } catch {
            errorBanner = PFCustomerFacingErrorCopy.claimFailureMessage(from: error)
            PFHaptics.warning()
        }
    }

    private static func parseISO(_ string: String) -> Date? {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: string) { return d }
        f.formatOptions = [.withInternetDateTime]
        return f.date(from: string)
    }
}
