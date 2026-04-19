import Combine
import Foundation

@MainActor
final class OperatorActionQueueViewModel: ObservableObject {
    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    @Published var loadState: LoadState = .idle
    @Published private(set) var didLoadOnce = false
    @Published var response: OperatorActionQueueResponse?
    @Published var selectedFilter: OperatorQueueFilter = .all
    @Published var lastUpdatedAt: Date?
    @Published var isRefreshing = false

    private let api: APIClient

    init(api: APIClient) {
        self.api = api
    }

    func load(silent: Bool = false) async {
        if !silent, response == nil {
            loadState = .loading
        }
        do {
            let result = try await api.getOperatorActionQueue()
            response = result
            loadState = .loaded
            lastUpdatedAt = Date()
            didLoadOnce = true
        } catch {
            if response == nil {
                loadState = .failed(APIErrorCopy.message(for: error))
            }
            didLoadOnce = true
        }
    }

    func refresh() async {
        isRefreshing = true
        defer { isRefreshing = false }
        await load(silent: true)
    }

    var summary: OperatorActionQueueSummary? {
        response?.summary
    }

    var filteredNeedsAction: [OperatorActionQueueItem] {
        switch selectedFilter {
        case .all, .needsAction: response?.sections.needsAction ?? []
        case .review, .resolved: []
        }
    }

    var filteredReview: [OperatorActionQueueItem] {
        switch selectedFilter {
        case .all, .review: response?.sections.review ?? []
        case .needsAction, .resolved: []
        }
    }

    var filteredResolved: [OperatorActionQueueItem] {
        switch selectedFilter {
        case .all, .resolved: response?.sections.resolved ?? []
        case .needsAction, .review: []
        }
    }
}
