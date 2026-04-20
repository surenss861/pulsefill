import Foundation
import Observation

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
        do {
            let response = try await api.getCustomerActivityFeed()
            items = response.items.sorted { $0.occurredAt > $1.occurredAt }
            loadState = .loaded
        } catch {
            loadState = .failed(APIErrorCopy.message(for: error))
        }
    }

    func refresh() async {
        await load()
    }

    var filteredItems: [CustomerActivityItem] {
        items.filter { selectedFilter.matches($0) }
    }
}
