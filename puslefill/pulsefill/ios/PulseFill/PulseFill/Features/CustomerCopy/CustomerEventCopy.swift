import Foundation

enum CustomerEventCopy {
    static func stateLabel(for kind: CustomerEventKind) -> String {
        switch kind {
        case .offerReceived: "New offer"
        case .offerExpiringSoon: "Expiring soon"
        case .offerExpired: "Expired"
        case .claimSubmitted: "Submitted"
        case .claimPendingConfirmation: "Pending confirmation"
        case .bookingConfirmed: "Confirmed"
        case .claimUnavailable: "Unavailable"
        case .missedOpportunity: "Missed"
        case .standbyStatusReminder: "Status"
        case .standbySetupSuggestion: "Suggestion"
        }
    }

    static func fallbackTitle(for kind: CustomerEventKind) -> String {
        switch kind {
        case .offerReceived: "Offer received"
        case .offerExpiringSoon: "Offer expiring soon"
        case .offerExpired: "Offer expired"
        case .claimSubmitted: "Claim submitted"
        case .claimPendingConfirmation: "Waiting for clinic confirmation"
        case .bookingConfirmed: "Booking confirmed"
        case .claimUnavailable: "Opening no longer available"
        case .missedOpportunity: "Missed opportunity"
        case .standbyStatusReminder: "Check your standby status"
        case .standbySetupSuggestion: "Improve your standby setup"
        }
    }
}
