import UIKit

final class AppDelegate: NSObject, UIApplicationDelegate {
    static weak var pushCoordinator: PushNotificationCoordinator?

    func application(
        _: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        Task { @MainActor in
            AppDelegate.pushCoordinator?.didRegisterForRemoteNotifications(deviceToken: deviceToken)
        }
    }
}
