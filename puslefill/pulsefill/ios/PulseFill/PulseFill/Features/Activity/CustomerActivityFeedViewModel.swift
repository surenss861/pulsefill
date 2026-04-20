import Foundation
import Observation
import UserNotifications

@Observable
@MainActor
final class CustomerActivityFeedViewModel {
    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    var loadState: LoadState = .idle
    var items: [CustomerActivityItem] = []
    var selectedFilter: CustomerActivityFilter = .all

    private let api: APIClient

    init(api: APIClient) {
        self.api = api
    }

    func load() async {
        if items.isEmpty { loadState = .loading }
        let push = await Self.queryPushPermissionStatus()
        do {
            let response = try await api.getCustomerActivityFeed(pushPermissionStatus: push)
            items = response.items.sorted { $0.occurredAt > $1.occurredAt }
            loadState = .loaded
        } catch {
            loadState = .failed(APIErrorCopy.message(for: error))
        }
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

    func refresh() async {
        await load()
    }

    var filteredItems: [CustomerActivityItem] {
        items.filter { selectedFilter.matches($0) }
    }
}
