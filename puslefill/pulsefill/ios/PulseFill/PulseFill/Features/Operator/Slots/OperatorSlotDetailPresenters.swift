import SwiftUI

enum OperatorSlotDetailPresenters {
    static func nextActionTitle(for status: String) -> String {
        switch status {
        case "claimed": "Confirm booking"
        case "open": "Send offers"
        case "offered": "Retry offers"
        case "booked": "Booking confirmed"
        case "expired": "Slot expired"
        case "cancelled": "Slot cancelled"
        default: "Review slot"
        }
    }

    static func nextActionDescription(for status: String) -> String {
        switch status {
        case "claimed":
            "A customer claimed this opening. Confirm it to finalize recovery."
        case "open":
            "This opening is ready to send to standby customers."
        case "offered":
            "Offers are active or can be retried if the slot still needs filling."
        case "booked":
            "This slot has already been confirmed."
        case "expired":
            "This opening expired without being filled."
        case "cancelled":
            "This opening was cancelled."
        default:
            "Review the slot details and take the next best action."
        }
    }

    static func offerOutcomeSummary(_ offers: [StaffSlotOfferRow]) -> String {
        let total = offers.count
        let claimed = offers.filter { $0.status == "claimed" }.count
        let delivered = offers.filter { $0.status == "delivered" }.count
        let failed = offers.filter { $0.status == "failed" }.count
        let expired = offers.filter { $0.status == "expired" }.count
        return "\(total) total · \(delivered) delivered · \(failed) failed · \(expired) expired · \(claimed) claimed"
    }

    static func latestMilestone(_ events: [OperatorTimelineEvent]) -> String? {
        events
            .sorted { $0.createdAt > $1.createdAt }
            .first?
            .eventType
    }
}
