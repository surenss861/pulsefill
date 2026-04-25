import Foundation
import UIKit
import UserNotifications

struct StandbyPushFollowUp: Equatable {
    var message: String?
    var showOpenSettings: Bool
}

struct PushDebugSnapshot: Equatable {
    enum AttemptState: String, Equatable {
        case success = "Success"
        case failed = "Failed"
        case never = "Never"
    }

    let permission: String
    let registrationState: AttemptState
    let registrationAt: Date?
    let deactivationState: AttemptState
    let deactivationAt: Date?
    let environment: String
    let appBuild: String
    let maskedToken: String?
}

@MainActor
final class PushRegistrationManager {
    private enum StorageKeys {
        static let lastAPNsToken = "pf.push.lastAPNsToken"
        static let registrationState = "pf.push.lastRegistrationState"
        static let registrationAt = "pf.push.lastRegistrationAt"
        static let deactivationState = "pf.push.lastDeactivationState"
        static let deactivationAt = "pf.push.lastDeactivationAt"
    }

    private let apiClient: APIClient

    /// Latest authorization status (refresh with `refreshAuthorizationStatus()`).
    private(set) var authorizationStatus: UNAuthorizationStatus = .notDetermined

    init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    private var lastRegisteredAPNsToken: String? {
        get { UserDefaults.standard.string(forKey: StorageKeys.lastAPNsToken) }
        set {
            if let value = newValue, !value.isEmpty {
                UserDefaults.standard.set(value, forKey: StorageKeys.lastAPNsToken)
            } else {
                UserDefaults.standard.removeObject(forKey: StorageKeys.lastAPNsToken)
            }
        }
    }

    private var lastRegistrationState: PushDebugSnapshot.AttemptState {
        get {
            let raw = UserDefaults.standard.string(forKey: StorageKeys.registrationState) ?? PushDebugSnapshot.AttemptState.never.rawValue
            return PushDebugSnapshot.AttemptState(rawValue: raw) ?? .never
        }
        set { UserDefaults.standard.set(newValue.rawValue, forKey: StorageKeys.registrationState) }
    }

    private var lastDeactivationState: PushDebugSnapshot.AttemptState {
        get {
            let raw = UserDefaults.standard.string(forKey: StorageKeys.deactivationState) ?? PushDebugSnapshot.AttemptState.never.rawValue
            return PushDebugSnapshot.AttemptState(rawValue: raw) ?? .never
        }
        set { UserDefaults.standard.set(newValue.rawValue, forKey: StorageKeys.deactivationState) }
    }

    private var lastRegistrationAt: Date? {
        get { UserDefaults.standard.object(forKey: StorageKeys.registrationAt) as? Date }
        set { UserDefaults.standard.set(newValue, forKey: StorageKeys.registrationAt) }
    }

    private var lastDeactivationAt: Date? {
        get { UserDefaults.standard.object(forKey: StorageKeys.deactivationAt) as? Date }
        set { UserDefaults.standard.set(newValue, forKey: StorageKeys.deactivationAt) }
    }

    func refreshAuthorizationStatus() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        authorizationStatus = settings.authorizationStatus
    }

    /// Whether alerts are enabled for common “notifications on” UI (includes provisional / ephemeral).
    var isPushAuthorizedForUI: Bool {
        switch authorizationStatus {
        case .authorized, .provisional, .ephemeral:
            return true
        default:
            return false
        }
    }

    /// Used on launch / sign-in: refresh the APNs token if the user already granted permission (no system prompt).
    func syncRemoteRegistrationIfAuthorized() async {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        authorizationStatus = settings.authorizationStatus
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
        guard wantsPush else {
            await refreshAuthorizationStatus()
            return StandbyPushFollowUp(message: nil, showOpenSettings: false)
        }
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        authorizationStatus = settings.authorizationStatus
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
                authorizationStatus = after.authorizationStatus
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
            tokenType: "apns",
            environment: environment,
            appBuild: build,
            replaceExisting: true
        )
        do {
            _ = try await apiClient.post("/v1/customers/me/push-devices", body: body, as: PushRegisterResponse.self)
            lastRegisteredAPNsToken = hex
            lastRegistrationState = .success
            lastRegistrationAt = Date()
        } catch {
            // Non-fatal: push can be retried on next launch.
            lastRegistrationState = .failed
            lastRegistrationAt = Date()
        }
    }

    /// Best effort on sign-out: deactivate the latest APNs token tied to this session.
    func deactivateCurrentDeviceIfNeeded() async {
        guard let token = lastRegisteredAPNsToken, !token.isEmpty else { return }
        let body = PushDeviceDeactivateBody(
            deviceToken: token,
            platform: "ios",
            tokenType: "apns"
        )
        do {
            _ = try await apiClient.post(
                "/v1/customers/me/push-devices/deactivate",
                body: body,
                as: PushDeactivateResponse.self
            )
            lastRegisteredAPNsToken = nil
            lastDeactivationState = .success
            lastDeactivationAt = Date()
        } catch {
            // Non-fatal: keep token stored and retry on a future signed-in sign-out.
            lastDeactivationState = .failed
            lastDeactivationAt = Date()
        }
    }

    func debugSnapshot() -> PushDebugSnapshot {
        let env: String = {
            #if DEBUG
            return "sandbox"
            #else
            return "production"
            #endif
        }()
        let build = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "Unknown"
        return PushDebugSnapshot(
            permission: permissionLabel(authorizationStatus),
            registrationState: lastRegistrationState,
            registrationAt: lastRegistrationAt,
            deactivationState: lastDeactivationState,
            deactivationAt: lastDeactivationAt,
            environment: env,
            appBuild: build,
            maskedToken: maskToken(lastRegisteredAPNsToken)
        )
    }

    private func permissionLabel(_ status: UNAuthorizationStatus) -> String {
        switch status {
        case .authorized, .provisional, .ephemeral:
            return "Granted"
        case .denied:
            return "Denied"
        case .notDetermined:
            return "Not determined"
        @unknown default:
            return "Unknown"
        }
    }

    private func maskToken(_ token: String?) -> String? {
        guard let token, !token.isEmpty else { return nil }
        if token.count <= 12 { return token }
        return "\(token.prefix(4))…\(token.suffix(4))"
    }
}

private struct PushDeviceRegisterBody: Encodable {
    let deviceToken: String
    let platform: String
    let tokenType: String
    let environment: String
    let appBuild: String?
    let replaceExisting: Bool
}

private struct PushRegisterResponse: Decodable {
    let registered: Bool?
    let id: String?
}

private struct PushDeviceDeactivateBody: Encodable {
    let deviceToken: String
    let platform: String
    let tokenType: String
}

private struct PushDeactivateResponse: Decodable {
    let deactivated: Bool?
    let deviceToken: String?
}
