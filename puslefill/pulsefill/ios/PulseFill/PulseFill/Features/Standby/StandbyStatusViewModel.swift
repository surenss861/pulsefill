import Combine
import Foundation
import UserNotifications

@MainActor
final class StandbyStatusViewModel: ObservableObject {
    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    @Published var loadState: LoadState = .idle
    @Published var data: StandbyStatusResponse?

    private let api: APIClient

    init(api: APIClient) {
        self.api = api
    }

    func load() async {
        if data == nil {
            loadState = .loading
        }

        let push = await Self.queryPushPermissionStatus()

        do {
            data = try await api.getStandbyStatus(pushPermissionStatus: push)
            loadState = .loaded
        } catch {
            loadState = .failed(APIErrorCopy.message(for: error))
        }
    }

    func refresh() async {
        await load()
    }

    private static func queryPushPermissionStatus() async -> String {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        switch settings.authorizationStatus {
        case .authorized:
            return "authorized"
        case .denied:
            return "denied"
        case .notDetermined:
            return "not_determined"
        case .provisional, .ephemeral:
            return "authorized"
        @unknown default:
            return "unknown"
        }
    }
}
