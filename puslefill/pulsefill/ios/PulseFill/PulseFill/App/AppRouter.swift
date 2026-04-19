import Combine
import Foundation

enum AppTab: Hashable {
    case home
    case offers
    case activity
    case profile
}

@MainActor
final class AppFlowRouter: ObservableObject {
    enum PendingDestination: Equatable {
        case offersInbox
        case offerDetail(offerId: String?, openSlotId: String?)
    }

    @Published var selectedTab: AppTab = .home
    @Published var pendingDestination: PendingDestination?

    func routeToOffer(offerId: String?, openSlotId: String?) {
        selectedTab = .offers
        pendingDestination = .offerDetail(offerId: offerId, openSlotId: openSlotId)
    }

    func routeToOffersInbox() {
        selectedTab = .offers
        pendingDestination = .offersInbox
    }

    func clearPendingDestination() {
        pendingDestination = nil
    }
}
