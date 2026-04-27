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

    /// One-line title for Home “Recent activity” (plain language, no internal jargon).
    static func homeActivityRowTitle(for item: CustomerActivityItem) -> String {
        let trimmed = item.title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let kind = CustomerEventKind(rawKind: item.kind) else {
            return trimmed.isEmpty ? "Update" : trimmed
        }

        let service: String? = {
            guard let raw = item.serviceName else { return nil }
            let s = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            return s.isEmpty ? nil : s
        }()

        switch kind {
        case .offerReceived:
            if let service { return "New opening · \(service)" }
            return "New opening for you"
        case .offerExpiringSoon:
            return "Opening ends soon"
        case .offerExpired:
            return "Opening timed out"
        case .claimSubmitted:
            return "You picked an earlier time"
        case .claimPendingConfirmation:
            return "Waiting on the clinic"
        case .bookingConfirmed:
            return "Appointment booked"
        case .claimUnavailable:
            return "That time was taken"
        case .missedOpportunity:
            return "Opening filled up"
        case .standbyStatusReminder:
            return "Standby updated"
        case .standbySetupSuggestion:
            return "Standby can alert you sooner"
        }
    }
}
