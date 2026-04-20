import Foundation

/// Canonical activity / deep-link event kinds (aligned with API `customer-event-taxonomy`).
enum CustomerEventKind: String, CaseIterable {
    case offerReceived = "offer_received"
    case offerExpiringSoon = "offer_expiring_soon"
    case offerExpired = "offer_expired"
    case claimSubmitted = "claim_submitted"
    case claimPendingConfirmation = "claim_pending_confirmation"
    case bookingConfirmed = "booking_confirmed"
    case claimUnavailable = "claim_unavailable"
    case missedOpportunity = "missed_opportunity"
    case standbyStatusReminder = "standby_status_reminder"
    case standbySetupSuggestion = "standby_setup_suggestion"

    init?(rawKind: String) {
        self.init(rawValue: rawKind)
    }
}
