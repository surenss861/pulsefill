import Foundation

/// Customer-facing strings for the “times that work” / standby setup flow (simple words, no backend jargon).
enum StandbySetupCustomerCopy {
    static let subtitleSetupLocked = "Choose the appointment times you want this business to send you."
    static let subtitleSetupOpen = "Connect to a business first, then tell us what times work for you."
    static let subtitleEdit = "Update the times you want to hear about."

    static let savePrimaryNew = "Save my times"
    static let savePrimaryEdit = "Save changes"

    static let validationIncomplete =
        "Connect to a business, pick at least one day you’re usually free, and make sure your latest time is after your earliest time."
    static let validationTimeOrder = "Set your latest time after your earliest time."

    static let businessBlockedTitle = "Connect to a business first"
    static let businessBlockedBody =
        "You need to join or request access to a business before you can tell us what times work."
    static let businessBlockedPrimary = "Find businesses"
    static let businessBlockedSecondary = "Use invite code"

    static let businessMissingTitle = "Step 1: Connect to a business"
    static let businessMissingBody = "Join a business before you set what times work for you."

    static let businessIdInvalid = "Enter the invite code the business shared with you."

    static let businessFieldPlaceholder = "Invite code from the business"

    static let servicesEmpty = "No services listed yet"
    static let servicesEmptyBody = "This business has not listed services yet. You can still choose “Any service” below."

    static let advancedOptionsTitle = "More matching options (optional)"
    static let advancedOptionsCaption =
        "Only fill these in if the business gave you a location or provider reference to use."

    static let locationFieldLabel = "Location reference (optional)"
    static let providerFieldLabel = "Provider reference (optional)"

    static func noticePresetShortLabel(hours: Int) -> String {
        switch hours {
        case 1: return "1 hour"
        case 2: return "2 hours"
        case 4: return "4 hours"
        case 8: return "8 hours"
        case 24: return "24 hours"
        case 48: return "48 hours"
        default:
            if hours < 24 { return "\(hours) hr" }
            let d = hours / 24
            return d == 1 ? "1 day" : "\(d) days"
        }
    }

    static func noticeSummaryLabel(hours: Int) -> String {
        switch hours {
        case 1: return "About 1 hour"
        case 2: return "At least 2 hours"
        case 4: return "At least 4 hours"
        case 8: return "At least 8 hours"
        case 24: return "At least 24 hours"
        case 48: return "At least 48 hours"
        default:
            return "At least \(hours) hours"
        }
    }

    static let distanceCaption = "How far you’re willing to go for an earlier appointment."
    static let depositToggle = "I’m OK if a deposit is required to claim a time"

    static let successTitle = "You’re all set"
    static let successBody =
        "We’ll show you appointment times from this business when they match what works for you."

    static let successViewOpenings = "View appointments"
    static let successDone = "Done"
}
