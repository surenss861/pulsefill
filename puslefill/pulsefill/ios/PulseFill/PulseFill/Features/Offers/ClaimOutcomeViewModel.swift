import Foundation
import Observation

@Observable
@MainActor
final class ClaimOutcomeViewModel {
    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    var loadState: LoadState = .idle
    var data: ClaimOutcomeResponse?

    private let api: APIClient
    private let claimId: String

    init(api: APIClient, claimId: String) {
        self.api = api
        self.claimId = claimId
    }

    func load() async {
        if data == nil { loadState = .loading }
        do {
            data = try await api.getClaimOutcome(claimId: claimId)
            loadState = .loaded
        } catch {
            loadState = .failed(APIErrorCopy.message(for: error))
        }
    }

    func refresh() async {
        await load()
    }
}
