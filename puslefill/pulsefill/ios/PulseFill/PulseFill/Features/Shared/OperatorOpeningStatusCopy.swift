import SwiftUI

/// Task-first labels for open-slot lifecycle on **operator** (staff / Business) screens.
enum OperatorOpeningStatusCopy {
    static func label(forRawStatus raw: String) -> String {
        let key = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        switch key {
        case "open":
            return "Ready to send offers"
        case "offered":
            return "Offers sent — waiting for a claim"
        case "claimed":
            return "Customer claimed — confirm booking"
        case "booked":
            return "Recovered booking confirmed"
        case "expired":
            return "No claim before expiry"
        case "cancelled", "canceled":
            return "Closed by staff"
        case "no_match", "no-match", "nomatch":
            return "No standby match"
        default:
            return raw.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }

    static func tone(forRawStatus raw: String) -> StatusChipView.Tone {
        let key = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        switch key {
        case "booked":
            return .success
        case "claimed":
            return .warning
        case "offered":
            return .neutral
        case "cancelled", "canceled", "failed":
            return .danger
        case "expired", "no_match", "no-match", "nomatch":
            return .neutral
        default:
            return .neutral
        }
    }
}
