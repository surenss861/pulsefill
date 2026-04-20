import Foundation
import UIKit
import UserNotifications

@MainActor
final class PushNotificationCoordinator: NSObject {
    private let customerNavigation: CustomerNavigationCoordinator
    private let pushRegistration: PushRegistrationManager

    init(customerNavigation: CustomerNavigationCoordinator, pushRegistration: PushRegistrationManager) {
        self.customerNavigation = customerNavigation
        self.pushRegistration = pushRegistration
        super.init()
        UNUserNotificationCenter.current().delegate = self
    }

    func bootstrapIfSignedIn(sessionStore: SessionStore) async {
        guard sessionStore.isSignedIn else { return }
        await pushRegistration.refreshAuthorizationStatus()
        await pushRegistration.syncRemoteRegistrationIfAuthorized()
    }

    func didRegisterForRemoteNotifications(deviceToken: Data) {
        Task {
            await pushRegistration.registerDeviceToken(deviceToken)
        }
    }

    private func handleNotificationPayload(_ userInfo: [AnyHashable: Any]) {
        let payload = NotificationRoutePayload(userInfo: userInfo)
        let key = payload.routeKey?.lowercased() ?? ""

        switch key {
        case "offer_received", "offer_expiring_soon", "offer":
            customerNavigation.routeToOffersTab(offerId: payload.offerId, openSlotId: payload.openSlotId)
            return
        default:
            break
        }

        if let destination = CustomerRouteMapper.destinationForPushPayload(
            type: key,
            offerId: payload.offerId,
            claimId: payload.claimId
        ) {
            customerNavigation.open(destination)
            return
        }

        if payload.offerId != nil || payload.openSlotId != nil {
            customerNavigation.routeToOffersTab(offerId: payload.offerId, openSlotId: payload.openSlotId)
        } else if let claimId = payload.claimId, !claimId.isEmpty {
            customerNavigation.open(.claimOutcome(claimId))
        } else {
            customerNavigation.openOffersInbox()
        }
    }
}

extension PushNotificationCoordinator: UNUserNotificationCenterDelegate {
    nonisolated func userNotificationCenter(
        _: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .badge])
    }

    nonisolated func userNotificationCenter(
        _: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        Task { @MainActor in
            self.handleNotificationPayload(userInfo)
            completionHandler()
        }
    }
}
