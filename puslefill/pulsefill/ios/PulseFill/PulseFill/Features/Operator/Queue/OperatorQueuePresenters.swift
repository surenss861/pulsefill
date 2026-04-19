import SwiftUI

enum OperatorQueuePresenters {
    static func severityColor(_ severity: OperatorQueueSeverity) -> Color {
        switch severity {
        case .high: PFColor.warning
        case .medium: PFColor.primary
        case .low: PFColor.success
        }
    }

    static func kindTitle(_ kind: OperatorQueueItemKind) -> String {
        switch kind {
        case .awaitingConfirmation: "Awaiting confirmation"
        case .deliveryFailed: "Delivery failed"
        case .retryRecommended: "Retry suggested"
        case .noMatches: "No matches"
        case .offeredActive: "Offers active"
        case .expiredUnfilled: "Expired unfilled"
        case .confirmedBooking: "Booking recovered"
        }
    }

    static func primaryActionTitle(_ action: OperatorQueueAction) -> String {
        switch action {
        case .confirmBooking: "Confirm"
        case .inspectLogs: "Inspect"
        case .retryOffers: "Retry"
        case .openSlot: "Open"
        case .viewSlot: "View"
        }
    }
}
