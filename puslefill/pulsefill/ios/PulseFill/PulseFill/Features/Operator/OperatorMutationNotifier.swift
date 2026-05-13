import Foundation

/// Refresh hints after operator mutations — list/detail observers can reconcile without tight coupling.
enum OperatorMutationRefreshAction: Hashable, Sendable {
    case confirmBooking
    case sendOffers
    case retryOffers
    case expireSlot
    case cancelSlot
    case createSlot
}

extension Notification.Name {
    static let pulsefillSlotMutated = Notification.Name("pulsefill.slot.mutated")
    static let pulsefillSlotInternalNoteSaved = Notification.Name("pulsefill.slot.internal_note.saved")
    static let pulsefillCustomerInvitesChanged = Notification.Name("pulsefill.customer_invites.changed")
    static let pulsefillStandbyRequestsChanged = Notification.Name("pulsefill.standby_requests.changed")
}

/// Names referenced by dashboards / queues / feeds (alias for `pulsefillSlot*` lifecycle posts).
enum OperatorRefreshNotifications {
    static let slotUpdated: Notification.Name = .pulsefillSlotMutated
    static let slotNoteUpdated: Notification.Name = .pulsefillSlotInternalNoteSaved
    static let customerInvitesChanged: Notification.Name = .pulsefillCustomerInvitesChanged
    static let standbyRequestsChanged: Notification.Name = .pulsefillStandbyRequestsChanged
}

/// Posts cross-screen refresh signals after operator-facing slot actions.
enum OperatorMutationNotifier {
    struct SlotMutationPayload {
        let slotId: String
        let action: OperatorMutationRefreshAction?
    }

    static func postSlotUpdated(slotId: String, action: OperatorMutationRefreshAction) {
        let payload = SlotMutationPayload(slotId: slotId, action: action)
        NotificationCenter.default.post(name: .pulsefillSlotMutated, object: payload)
    }

    static func postSlotNoteUpdated(slotId: String) {
        NotificationCenter.default.post(name: .pulsefillSlotInternalNoteSaved, object: slotId)
    }

    static func postCustomerInvitesChanged() {
        NotificationCenter.default.post(name: .pulsefillCustomerInvitesChanged, object: nil)
    }

    static func postStandbyRequestsChanged() {
        NotificationCenter.default.post(name: .pulsefillStandbyRequestsChanged, object: nil)
    }
}
