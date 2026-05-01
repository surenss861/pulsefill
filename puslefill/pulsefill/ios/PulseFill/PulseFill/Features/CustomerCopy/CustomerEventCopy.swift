import Foundation

enum CustomerEventCopy {
    static func stateLabel(for kind: CustomerEventKind) -> String {
        switch kind {
        case .offerReceived: "New opening"
        case .offerExpiringSoon: "Ends soon"
        case .offerExpired: "No longer available"
        case .claimSubmitted: "Claim sent"
        case .claimPendingConfirmation: "Waiting for confirmation"
        case .bookingConfirmed: "Confirmed"
        case .claimUnavailable: "No longer available"
        case .missedOpportunity: "Missed"
        case .standbyStatusReminder: "Status"
        case .standbySetupSuggestion: "Suggestion"
        }
    }

    static func fallbackTitle(for kind: CustomerEventKind) -> String {
        switch kind {
        case .offerReceived: "Opening received"
        case .offerExpiringSoon: "Opening ends soon"
        case .offerExpired: "Opening no longer available"
        case .claimSubmitted: "Claim sent"
        case .claimPendingConfirmation: "Waiting for confirmation"
        case .bookingConfirmed: "Confirmed"
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
            return "Opening no longer available"
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
