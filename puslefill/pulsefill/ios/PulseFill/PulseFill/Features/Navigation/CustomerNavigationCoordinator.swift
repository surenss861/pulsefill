import Combine
import Foundation

/// Pending resolution for the Offers tab (match inbox row by id or open slot).
struct PendingOfferRouting: Equatable {
    var offerId: String?
    var openSlotId: String?
}

@MainActor
final class CustomerNavigationCoordinator: ObservableObject {
    @Published var selectedTab: AppTab = .home
    @Published private(set) var pendingCustomerDestination: CustomerDestination?
    @Published private(set) var pendingOfferRouting: PendingOfferRouting?

    func open(_ destination: CustomerDestination) {
        switch destination {
        case .offerDetail(let offerId):
            selectedTab = .offers
            pendingOfferRouting = PendingOfferRouting(offerId: offerId, openSlotId: nil)
            pendingCustomerDestination = nil

        case .claimOutcome, .activity:
            selectedTab = .activity
            pendingCustomerDestination = destination

        case .missedOpportunities, .standbyStatus, .notificationSettings:
            selectedTab = .profile
            pendingCustomerDestination = destination
        }
    }

    func routeToOffersTab(offerId: String?, openSlotId: String?) {
        selectedTab = .offers
        pendingOfferRouting = PendingOfferRouting(offerId: offerId, openSlotId: openSlotId)
        pendingCustomerDestination = nil
    }

    func openOffersInbox() {
        selectedTab = .offers
        pendingOfferRouting = nil
        pendingCustomerDestination = nil
    }

    func clearPendingOfferRouting() {
        pendingOfferRouting = nil
    }

    /// Removes and returns a pending destination only when the predicate matches (avoids the wrong tab consuming it).
    func takePendingDestination(matching predicate: (CustomerDestination) -> Bool) -> CustomerDestination? {
        guard let destination = pendingCustomerDestination, predicate(destination) else { return nil }
        pendingCustomerDestination = nil
        return destination
    }
}
