import Foundation

/// Single app-level routing model for customer flows (activity, push, onboarding, banners).
enum CustomerDestination: Hashable {
    case offerDetail(String)
    case claimOutcome(String)
    case missedOpportunities
    case standbyStatus
    case notificationSettings
    /// Deep-link to the activity tab root (no pushed detail).
    case activity
}
