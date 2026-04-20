import Foundation
import Observation
import UserNotifications

@Observable
@MainActor
final class NotificationPreferencesViewModel {
    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    var loadState: LoadState = .idle
    var response: NotificationPreferencesResponse?

    var quietHoursEnabled = false
    var quietHoursStartLocal = "22:00:00"
    var quietHoursEndLocal = "07:00:00"
    var cadencePreference = "all_opportunities"
    var notifyNewOffers = true
    var notifyClaimUpdates = true
    var notifyBookingConfirmations = true
    var notifyStandbyTips = true

    var isSaving = false
    var flashMessage: String?

    private let api: APIClient

    init(api: APIClient) {
        self.api = api
    }

    func load() async {
        if response == nil { loadState = .loading }
        do {
            let permission = await Self.currentPushPermissionStatus()
            let result = try await api.getNotificationPreferences(pushPermissionStatus: permission)
            response = result
            apply(result.preferences)
            loadState = .loaded
        } catch {
            loadState = .failed(APIErrorCopy.message(for: error))
        }
    }

    func refresh() async {
        await load()
    }

    func save() async {
        isSaving = true
        defer { isSaving = false }
        do {
            let permission = await Self.currentPushPermissionStatus()
            let body = UpdateNotificationPreferencesBody(
                quietHoursEnabled: quietHoursEnabled,
                quietHoursStartLocal: quietHoursEnabled ? quietHoursStartLocal : nil,
                quietHoursEndLocal: quietHoursEnabled ? quietHoursEndLocal : nil,
                cadencePreference: cadencePreference,
                notifyNewOffers: notifyNewOffers,
                notifyClaimUpdates: notifyClaimUpdates,
                notifyBookingConfirmations: notifyBookingConfirmations,
                notifyStandbyTips: notifyStandbyTips
            )
            let result = try await api.updateNotificationPreferences(
                pushPermissionStatus: permission,
                body: body
            )
            response = result
            apply(result.preferences)
            flashMessage = "Notification settings updated."
        } catch {
            flashMessage = APIErrorCopy.message(for: error)
        }
    }

    private func apply(_ preferences: CustomerNotificationPreferences) {
        quietHoursEnabled = preferences.quietHoursEnabled
        quietHoursStartLocal = preferences.quietHoursStartLocal ?? "22:00:00"
        quietHoursEndLocal = preferences.quietHoursEndLocal ?? "07:00:00"
        cadencePreference = preferences.cadencePreference
        notifyNewOffers = preferences.notifyNewOffers
        notifyClaimUpdates = preferences.notifyClaimUpdates
        notifyBookingConfirmations = preferences.notifyBookingConfirmations
        notifyStandbyTips = preferences.notifyStandbyTips
    }

    private static func currentPushPermissionStatus() async -> String {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        switch settings.authorizationStatus {
        case .authorized, .provisional, .ephemeral:
            return "authorized"
        case .denied:
            return "denied"
        case .notDetermined:
            return "not_determined"
        @unknown default:
            return "unknown"
        }
    }
}
