import Foundation

// MARK: - GET /v1/open-slots/:id (server-owned operator contract)

struct OperatorSlotQueueContext: Codable, Equatable {
    let currentCategory: String?
    let currentSection: String?
    let reasonTitle: String?
    let reasonDetail: String?
    let severity: String?
}

enum OperatorSlotAvailableAction: String, Codable, CaseIterable, Hashable {
    case confirmBooking = "confirm_booking"
    case retryOffers = "retry_offers"
    case sendOffers = "send_offers"
    case expireSlot = "expire_slot"
    case cancelSlot = "cancel_slot"
    case addNote = "add_note"
    case inspectNotificationLogs = "inspect_notification_logs"

    var title: String {
        switch self {
        case .confirmBooking: "Confirm booking"
        case .retryOffers: "Retry offers"
        case .sendOffers: "Send offers"
        case .expireSlot: "Expire slot"
        case .cancelSlot: "Cancel slot"
        case .addNote: "Add note"
        case .inspectNotificationLogs: "Inspect delivery logs"
        }
    }

    var isUtility: Bool {
        self == .addNote || self == .inspectNotificationLogs
    }

    var sortIndex: Int {
        switch self {
        case .confirmBooking: return 0
        case .retryOffers: return 1
        case .sendOffers: return 2
        case .expireSlot: return 3
        case .cancelSlot: return 4
        case .addNote: return 5
        case .inspectNotificationLogs: return 6
        }
    }
}
