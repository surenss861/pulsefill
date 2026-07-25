import Foundation
import Observation
import StripePaymentSheet

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

    /// Non-nil once a payment intent is ready — the view presents PaymentSheet when this is set.
    var paymentSheet: PaymentSheet?
    var isPreparingPayment = false

    private var pendingPaymentIntentId: String?
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
            isClaiming: isClaiming || isPreparingPayment,
        )
    }

    var primaryActionTitle: String {
        if isPreparingPayment { return "Preparing payment…" }
        return detailUIState.claimButtonTitle
    }

    var canClaim: Bool {
        guard let offer else { return false }
        guard let slotId = offer.openSlotId, !slotId.isEmpty else { return false }
        if isClaiming || isPreparingPayment { return false }
        return detailUIState.showsClaimButton
    }

    func claimOpening() async {
        guard let offer, let slotId = offer.openSlotId, !slotId.isEmpty else { return }
        guard canClaim else { return }

        if offer.paymentRequired == true {
            await prepareAndPresentPayment(slotId: slotId)
            return
        }

        await performClaim(slotId: slotId, paymentIntentId: nil)
    }

    /// Called from the view once PaymentSheet finishes (completed / canceled / failed).
    func handlePaymentSheetCompletion(_ result: PaymentSheetResult) async {
        defer {
            paymentSheet = nil
        }
        switch result {
        case .completed:
            guard let slotId = offer?.openSlotId, let paymentIntentId = pendingPaymentIntentId else { return }
            pendingPaymentIntentId = nil
            await performClaim(slotId: slotId, paymentIntentId: paymentIntentId)
        case .canceled:
            pendingPaymentIntentId = nil
        case let .failed(error):
            pendingPaymentIntentId = nil
            errorBanner = PFCustomerFacingErrorCopy.sanitizeCustomerMessage(error.localizedDescription)
            PFHaptics.warning()
        }
    }

    private func prepareAndPresentPayment(slotId: String) async {
        isPreparingPayment = true
        errorBanner = nil
        defer { isPreparingPayment = false }
        do {
            let intent = try await api.createSlotPaymentIntent(slotId: slotId)
            pendingPaymentIntentId = intent.paymentIntentId
            var configuration = PaymentSheet.Configuration()
            configuration.merchantDisplayName = "PulseFill"
            paymentSheet = PaymentSheet(paymentIntentClientSecret: intent.clientSecret, configuration: configuration)
        } catch {
            errorBanner = PFCustomerFacingErrorCopy.claimFailureMessage(from: error)
            PFHaptics.warning()
        }
    }

    private func performClaim(slotId: String, paymentIntentId: String?) async {
        isClaiming = true
        errorBanner = nil
        defer { isClaiming = false }
        PFHaptics.mediumImpact()
        do {
            let res = try await api.claimSlot(slotId: slotId, paymentIntentId: paymentIntentId)
            guard res.ok else {
                errorBanner = paymentIntentId != nil
                    ? "This opening was claimed by someone else. Your card was not charged."
                    : "This opening could not be claimed right now."
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
                successBanner = "You claimed this opening. The business still needs to confirm it."
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
