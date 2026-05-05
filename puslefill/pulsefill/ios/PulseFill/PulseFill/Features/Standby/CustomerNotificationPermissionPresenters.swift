import Foundation

/// Customer-facing strings for iOS notification permission + delivery readiness (never show raw APNs / token / device IDs).
enum CustomerNotificationPermissionCopy {
    /// Short status for a row (no snake_case).
    static func phoneAlertsShortLabel(_ rawStatus: String) -> String {
        switch rawStatus.lowercased() {
        case "authorized":
            return "On"
        case "denied":
            return "Off"
        case "not_determined":
            return "Not asked yet"
        default:
            return "Check Settings"
        }
    }

    /// One paragraph for cards and callouts.
    static func phoneAlertsExplainer(_ rawStatus: String) -> String {
        switch rawStatus.lowercased() {
        case "authorized":
            return "Phone alerts are allowed for PulseFill. Time-sensitive openings can notify you on this phone when your preferences match."
        case "denied":
            return "Phone alerts are turned off for PulseFill. You can still receive updates by email when the business has one on file, or turn alerts on in the Settings app."
        case "not_determined":
            return "We haven’t asked for phone alerts yet. When PulseFill requests access, choose Allow if you want quick nudges for new openings."
        default:
            return "If openings feel quiet, open the Settings app → Notifications → PulseFill and choose how you’d like to be reached."
        }
    }

    /// Replaces “device registered” style wording.
    static func thisAppReceivesAlertsLine(hasRegistered: Bool, permissionRaw: String) -> String {
        if permissionRaw.lowercased() == "denied" {
            return "This app won’t buzz your phone until alerts are allowed in Settings."
        }
        if hasRegistered {
            return "This app is set up to receive opening alerts on this phone when they’re turned on."
        }
        return "We’ll finish connecting alerts on this phone the next time you open PulseFill."
    }
}
