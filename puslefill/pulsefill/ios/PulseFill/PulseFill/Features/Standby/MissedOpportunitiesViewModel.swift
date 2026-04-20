import Foundation
import Observation

@Observable
@MainActor
final class MissedOpportunitiesViewModel {
    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    var loadState: LoadState = .idle
    var data: MissedOpportunitiesResponse?

    private let api: APIClient

    init(api: APIClient) {
        self.api = api
    }

    func load() async {
        if data == nil { loadState = .loading }
        do {
            data = try await api.getMissedOpportunities()
            loadState = .loaded
        } catch {
            loadState = .failed(APIErrorCopy.message(for: error))
        }
    }

    func refresh() async {
        await load()
    }
}
