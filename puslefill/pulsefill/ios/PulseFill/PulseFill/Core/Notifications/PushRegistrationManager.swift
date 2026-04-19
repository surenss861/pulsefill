import Foundation
import UIKit
import UserNotifications

struct StandbyPushFollowUp: Equatable {
    var message: String?
    var showOpenSettings: Bool
}

@MainActor
final class PushRegistrationManager {
    private let apiClient: APIClient

    init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    /// Used on launch / sign-in: refresh the APNs token if the user already granted permission (no system prompt).
    func syncRemoteRegistrationIfAuthorized() async {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        switch settings.authorizationStatus {
        case .authorized, .provisional, .ephemeral:
            UIApplication.shared.registerForRemoteNotifications()
        default:
            break
        }
    }

    /// Legacy entry point; prefer contextual `standbyPushFollowUp(wantsPush:)` for new UX.
    func requestAuthorizationAndRegister() async {
        let center = UNUserNotificationCenter.current()
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
            guard granted else { return }
            UIApplication.shared.registerForRemoteNotifications()
        } catch {
            // Authorization failed; operator can enable in Settings later.
        }
    }

    /// After the customer saves standby with “stay reachable” on: prompt only if status is `.notDetermined`.
    func standbyPushFollowUp(wantsPush: Bool) async -> StandbyPushFollowUp {
        guard wantsPush else { return StandbyPushFollowUp(message: nil, showOpenSettings: false) }
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        switch settings.authorizationStatus {
        case .authorized, .provisional, .ephemeral:
            UIApplication.shared.registerForRemoteNotifications()
            return StandbyPushFollowUp(message: nil, showOpenSettings: false)
        case .denied:
            return StandbyPushFollowUp(
                message: "Notifications are off. Turn them on in Settings › PulseFill so we can alert you to openings.",
                showOpenSettings: true
            )
        case .notDetermined:
            do {
                let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
                if granted {
                    UIApplication.shared.registerForRemoteNotifications()
                    return StandbyPushFollowUp(
                        message: "Push alerts are on — we’ll notify you when a matching opening appears.",
                        showOpenSettings: false
                    )
                }
                let after = await center.notificationSettings()
                if after.authorizationStatus == .denied {
                    return StandbyPushFollowUp(
                        message: "Without notifications you may miss openings. Turn them on in Settings so we can reach you.",
                        showOpenSettings: true
                    )
                }
                return StandbyPushFollowUp(
                    message: "Without notifications you may miss openings. You can enable them later in Settings.",
                    showOpenSettings: false
                )
            } catch {
                return StandbyPushFollowUp(
                    message: "Couldn’t enable notifications. You can turn them on in Settings.",
                    showOpenSettings: true
                )
            }
        @unknown default:
            return StandbyPushFollowUp(message: nil, showOpenSettings: false)
        }
    }

    func registerDeviceToken(_ deviceToken: Data) async {
        let hex = deviceToken.map { String(format: "%02x", $0) }.joined()
        #if DEBUG
        let environment = "development"
        #else
        let environment = "production"
        #endif
        let build = Bundle.main.infoDictionary?["CFBundleVersion"] as? String
        let body = PushDeviceRegisterBody(
            deviceToken: hex,
            platform: "ios",
            environment: environment,
            appBuild: build
        )
        do {
            _ = try await apiClient.post("/v1/customers/me/push-devices", body: body, as: PushRegisterResponse.self)
        } catch {
            // Non-fatal: push can be retried on next launch.
        }
    }
}

private struct PushDeviceRegisterBody: Encodable {
    let deviceToken: String
    let platform: String
    let environment: String
    let appBuild: String?
}

private struct PushRegisterResponse: Decodable {
    let registered: Bool?
    let id: String?
}
