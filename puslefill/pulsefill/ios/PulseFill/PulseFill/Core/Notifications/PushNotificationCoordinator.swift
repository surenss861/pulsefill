import Foundation
import UIKit
import UserNotifications

@MainActor
final class PushNotificationCoordinator: NSObject {
    private let router: AppFlowRouter
    private let pushRegistration: PushRegistrationManager

    init(router: AppFlowRouter, pushRegistration: PushRegistrationManager) {
        self.router = router
        self.pushRegistration = pushRegistration
        super.init()
        UNUserNotificationCenter.current().delegate = self
    }

    func bootstrapIfSignedIn(sessionStore: SessionStore) async {
        guard sessionStore.isSignedIn else { return }
        await pushRegistration.syncRemoteRegistrationIfAuthorized()
    }

    func didRegisterForRemoteNotifications(deviceToken: Data) {
        Task {
            await pushRegistration.registerDeviceToken(deviceToken)
        }
    }

    private func handleNotificationPayload(_ userInfo: [AnyHashable: Any]) {
        let payload = NotificationRoutePayload(userInfo: userInfo)
        switch payload.kind {
        case "offer":
            router.routeToOffer(offerId: payload.offerId, openSlotId: payload.openSlotId)
        default:
            router.routeToOffersInbox()
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
