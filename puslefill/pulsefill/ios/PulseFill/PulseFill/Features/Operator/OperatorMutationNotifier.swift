import Foundation

/// Cross-surface refresh parity with dashboard `operator-refresh-events` (NotificationCenter instead of `window`).
enum OperatorRefreshNotifications {
    static let slotUpdated = Notification.Name("pulsefill.operator.slotUpdated")
    static let slotNoteUpdated = Notification.Name("pulsefill.operator.slotNoteUpdated")

    static let slotIdKey = "slotId"
    static let actionKey = "action"
}

/// Raw `action` strings match web `OperatorRefreshAction` for debugging / future filtering.
enum OperatorMutationRefreshAction: String {
    case confirmBooking = "confirm_booking"
    case retryOffers = "retry_offers"
    case sendOffers = "send_offers"
    case expireSlot = "expire_slot"
    case cancelSlot = "cancel_slot"
    case addNote = "add_note"
}

enum OperatorMutationNotifier {
    static func postSlotUpdated(slotId: String, action: OperatorMutationRefreshAction) {
        NotificationCenter.default.post(
            name: OperatorRefreshNotifications.slotUpdated,
            object: nil,
            userInfo: [
                OperatorRefreshNotifications.slotIdKey: slotId,
                OperatorRefreshNotifications.actionKey: action.rawValue,
            ]
        )
    }

    static func postSlotNoteUpdated(slotId: String) {
        NotificationCenter.default.post(
            name: OperatorRefreshNotifications.slotNoteUpdated,
            object: nil,
            userInfo: [OperatorRefreshNotifications.slotIdKey: slotId]
        )
    }
}
