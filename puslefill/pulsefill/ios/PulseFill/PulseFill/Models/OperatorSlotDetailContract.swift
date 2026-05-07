import Foundation

// MARK: - GET /v1/open-slots/:id (server-owned operator contract)

struct OperatorSlotQueueContext: Codable, Equatable {
    let currentCategory: String?
    let currentSection: String?
    let reasonTitle: String?
    let reasonDetail: String?
    let severity: String?
}

/// Server-authored actionable steps; tolerates new / unknown kinds without decoding failures.
enum OperatorSlotAvailableAction: Codable, Hashable, Sendable {
    case confirmBooking
    case retryOffers
    case sendOffers
    case expireSlot
    case cancelSlot
    case addNote
    case inspectNotificationLogs
    /// Unrecognized backend action — forward-compatible payloads still decode.
    case unknown(kind: String)

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = Self.normalized(decodingWire: raw)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(wireKey)
    }

    private static func normalized(decodingWire raw: String) -> OperatorSlotAvailableAction {
        let normalized = raw
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()
            .replacingOccurrences(of: "-", with: "_")
        switch normalized {
        case "confirm_booking", "confirmbooking":
            return .confirmBooking
        case "retry_offers", "retryoffers":
            return .retryOffers
        case "send_offers", "sendoffers":
            return .sendOffers
        case "expire_slot", "expire_slot_action", "expire_opening":
            return .expireSlot
        case "cancel_slot", "cancel_opening":
            return .cancelSlot
        case "add_note", "internal_note":
            return .addNote
        case "inspect_notification_logs", "notification_logs", "delivery_logs":
            return .inspectNotificationLogs
        default:
            return .unknown(kind: raw)
        }
    }

    private var wireKey: String {
        switch self {
        case .confirmBooking:
            return "confirm_booking"
        case .retryOffers:
            return "retry_offers"
        case .sendOffers:
            return "send_offers"
        case .expireSlot:
            return "expire_slot"
        case .cancelSlot:
            return "cancel_slot"
        case .addNote:
            return "add_note"
        case .inspectNotificationLogs:
            return "inspect_notification_logs"
        case let .unknown(kind):
            return kind
        }
    }

    var title: String {
        switch self {
        case .confirmBooking:
            return "Confirm booking"
        case .retryOffers:
            return "Retry offers"
        case .sendOffers:
            return "Send offers"
        case .expireSlot:
            return "Expire opening"
        case .cancelSlot:
            return "Cancel opening"
        case .addNote:
            return "Add internal note"
        case .inspectNotificationLogs:
            return "Inspect delivery logs"
        case let .unknown(kind):
            return kind
                .replacingOccurrences(of: "_", with: " ")
                .replacingOccurrences(of: "-", with: " ")
                .capitalized
        }
    }

    var isUtility: Bool {
        switch self {
        case .addNote, .inspectNotificationLogs:
            return true
        default:
            return false
        }
    }

    var sortIndex: Int {
        switch self {
        case .confirmBooking:
            return 0
        case .sendOffers:
            return 1
        case .retryOffers:
            return 2
        case .expireSlot:
            return 30
        case .cancelSlot:
            return 31
        case .unknown:
            return 45
        case .addNote:
            return 70
        case .inspectNotificationLogs:
            return 71
        }
    }
}
