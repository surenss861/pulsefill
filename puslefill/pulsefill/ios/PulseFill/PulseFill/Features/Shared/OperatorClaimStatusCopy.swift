import SwiftUI

/// Human-readable **claim / booking** statuses on operator lists (distinct from open-slot lifecycle chips).
enum OperatorClaimStatusCopy {
    static func label(forRawStatus raw: String) -> String {
        let key = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        switch key {
        case "claimed", "pending", "pending_staff", "pending_staff_confirmation", "waiting_confirmation":
            return "Needs staff confirmation"
        case "confirmed", "booked", "completed":
            return "Confirmed"
        case "lost", "lost_race", "rejected", "superseded":
            return "Lost to another claimant"
        case "expired", "cancelled", "canceled", "withdrawn":
            return "Unavailable"
        case "offer_sent", "offered":
            return "Offered"
        default:
            return raw.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }

    static func tone(forRawStatus raw: String) -> StatusChipView.Tone {
        let key = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        switch key {
        case "confirmed", "booked", "completed":
            return .success
        case "claimed", "pending", "pending_staff", "pending_staff_confirmation", "waiting_confirmation":
            return .warning
        case "lost", "lost_race", "rejected", "superseded", "expired", "cancelled", "canceled", "withdrawn":
            return .danger
        default:
            return .neutral
        }
    }
}
