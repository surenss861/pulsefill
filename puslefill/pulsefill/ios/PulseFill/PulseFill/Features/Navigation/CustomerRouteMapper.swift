import Foundation

enum CustomerRouteMapper {
    static func destinationForActivityItem(_ item: CustomerActivityItem) -> CustomerDestination? {
        guard let kind = CustomerEventKind(rawKind: item.kind) else { return nil }
        switch kind {
        case .offerReceived, .offerExpiringSoon:
            guard let offerId = item.offerId else { return nil }
            return .offerDetail(offerId)

        case .claimSubmitted, .claimPendingConfirmation, .bookingConfirmed, .claimUnavailable:
            guard let claimId = item.claimId else { return nil }
            return .claimOutcome(claimId)

        case .offerExpired, .missedOpportunity:
            return .missedOpportunities

        case .standbyStatusReminder:
            return .standbyStatus

        case .standbySetupSuggestion:
            return .notificationSettings
        }
    }

    /// Maps normalized push `type` strings (plus legacy aliases) to a customer destination.
    /// Offer-style pushes return `nil`; use `routeToOffersTab(offerId:openSlotId:)` for those.
    static func destinationForPushPayload(
        type: String,
        offerId: String?,
        claimId: String?
    ) -> CustomerDestination? {
        let t = type.lowercased()
        switch t {
        case "offer_received", "offer_expiring_soon", "offer":
            return nil

        case "claim_submitted", "claim_pending_confirmation", "claim_pending", "claim_updated",
             "booking_confirmed", "claim_unavailable":
            if let claimId, !claimId.isEmpty {
                return .claimOutcome(claimId)
            }
            return .activity

        case "offer_expired", "offer_missed", "offer_unavailable", "missed_opportunity":
            return .missedOpportunities

        case "standby_status", "standby_status_reminder":
            return .standbyStatus

        case "standby_suggestions", "standby_setup_suggestion":
            return .notificationSettings

        case "activity":
            return .activity

        default:
            return nil
        }
    }
}
