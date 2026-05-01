import Foundation

/// Patient-facing states for the opening **detail** screen (maps API + local claiming).
enum OfferDetailUIState: Equatable {
    case claiming
    case available
    case waitingForConfirmation
    case confirmed
    case expired
    case unavailable
    /// Another customer was selected or the opening was filled — never show the word “lost”.
    case taken
    case unknown

    static func resolve(
        displayStatus: CustomerOfferDisplayStatus,
        rawOfferStatus: String?,
        isClaiming: Bool,
    ) -> OfferDetailUIState {
        if isClaiming { return .claiming }

        let raw = rawOfferStatus?.lowercased().trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if ["lost", "claim_lost", "not_won", "lost_out"].contains(raw) {
            return .taken
        }

        switch displayStatus {
        case .readyToClaim, .offerAvailable, .expiresSoon:
            return .available
        case .claimed:
            return .waitingForConfirmation
        case .confirmed:
            return .confirmed
        case .expired:
            return .expired
        case .unavailable:
            return .unavailable
        case .unknown:
            return .unknown
        }
    }

    var bannerTitle: String {
        switch self {
        case .claiming:
            return "Claiming opening"
        case .available:
            return "Opening available"
        case .waitingForConfirmation:
            return "Waiting for confirmation"
        case .confirmed:
            return "Confirmed"
        case .expired, .unavailable:
            return "No longer available"
        case .taken:
            return "This opening was taken"
        case .unknown:
            return "Status unavailable"
        }
    }

    var bannerMessage: String {
        switch self {
        case .claiming:
            return "Sending your claim now."
        case .available:
            return "You can claim this opening if the time still works for you."
        case .waitingForConfirmation:
            return "Your claim was sent. The business will confirm if this opening can be booked."
        case .confirmed:
            return "You’re booked for this opening."
        case .expired:
            return "This opening expired or was filled before you could claim it."
        case .unavailable:
            return "This opening is not available anymore."
        case .taken:
            return "Someone else claimed this opening first, or the business chose another customer."
        case .unknown:
            return "Pull to refresh or check again shortly."
        }
    }

    var claimButtonTitle: String {
        switch self {
        case .claiming:
            return "Claiming…"
        case .available:
            return "Claim opening"
        default:
            return ""
        }
    }

    var showsClaimButton: Bool {
        self == .available
    }

    var nextStepTitle: String {
        "What happens next"
    }

    func nextStepBody(fallbackGuidance: OfferClaimGuidance?) -> String {
        switch self {
        case .available:
            return "Claiming tells the business you want this opening. You’ll see a confirmation here once they approve it."
        case .claiming:
            return "We’re sending your claim now."
        case .waitingForConfirmation:
            return "You do not need to claim again. We’ll update this screen when the status changes."
        case .confirmed:
            return "If you need to change anything, contact the business directly."
        case .expired, .unavailable:
            return "You can stay on standby for future openings from this business."
        case .taken:
            return "Stay on standby and we’ll let you know when another matching opening becomes available."
        case .unknown:
            return fallbackGuidance?.detail
                ?? "Refresh this screen or check back shortly."
        }
    }

    func whyReceivedParagraph(offer: CustomerOfferDetail) -> String {
        if let m = offer.matchedPreference {
            var parts: [String] = ["This matches the standby preferences you set for this business."]
            if let s = m.serviceName?.trimmingCharacters(in: .whitespacesAndNewlines), !s.isEmpty {
                parts.append("Matched setup includes: \(s).")
            }
            return parts.joined(separator: " ")
        }
        if let s = offer.serviceName?.trimmingCharacters(in: .whitespacesAndNewlines), !s.isEmpty {
            return "This matches the standby preferences you set for \(s)."
        }
        return "This matches the standby preferences you set for this business."
    }
}
