import SwiftUI

enum CustomerStateLabelPresenter {
    static func label(for kind: CustomerEventKind) -> String {
        CustomerEventCopy.stateLabel(for: kind)
    }

    static func color(for kind: CustomerEventKind) -> Color {
        switch kind {
        case .bookingConfirmed:
            PFColor.success
        case .claimPendingConfirmation, .offerReceived, .offerExpiringSoon:
            PFColor.primary
        case .offerExpired, .claimUnavailable, .missedOpportunity:
            PFColor.warning
        case .standbyStatusReminder, .standbySetupSuggestion:
            PFColor.primary
        default:
            PFColor.textSecondary
        }
    }
}
