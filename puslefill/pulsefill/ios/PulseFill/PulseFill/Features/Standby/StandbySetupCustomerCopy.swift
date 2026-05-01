import Foundation

/// Customer-facing strings for the standby preferences / setup flow (no IDs or backend jargon in UI).
enum StandbySetupCustomerCopy {
    static let subtitleSetupLocked = "Choose the openings you want this business to send you."
    static let subtitleSetupOpen = "Choose a business, then tell us which openings and times work for you."
    static let subtitleEdit = "Update the openings you want to hear about."

    static let savePrimaryNew = "Save standby preferences"
    static let savePrimaryEdit = "Save changes"

    static let validationIncomplete =
        "Choose a business, pick at least one day you’re usually available, and make sure your latest time is after your earliest time."
    static let validationTimeOrder = "Set your latest time after your earliest time."

    static let businessMissingTitle = "Choose a business"
    static let businessMissingBody = "Pick a business before setting your standby preferences."

    static let businessIdInvalid = "Enter the business identifier your clinic shared with you."

    static let servicesEmpty = "No services listed yet"
    static let servicesEmptyBody = "This business has not listed services for standby. You can still choose “Any service” below."

    static let advancedOptionsTitle = "More matching options (optional)"
    static let advancedOptionsCaption =
        "Only fill these in if your clinic gave you a location or provider reference to use."

    static let locationFieldLabel = "Location reference (optional)"
    static let providerFieldLabel = "Provider reference (optional)"

    /// Short label for notice presets in grids.
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

    /// Review row / summary line for minimum notice.
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

    static let distanceCaption = "How far you’re willing to go for an earlier time."
    static let depositToggle = "I’m OK if a deposit is required to claim an opening"

    static let successTitle = "You’re on standby"
    static let successBody =
        "We’ll show openings from this business when they match your preferences."

    static let successViewOpenings = "View openings"
    static let successDone = "Done"
}
