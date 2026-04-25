import Combine
import Foundation

@MainActor
final class OperatorOverviewViewModel: ObservableObject {
    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    @Published var loadState: LoadState = .idle
    @Published var dailySummary: OperatorDailyOpsSummaryResponse?
    @Published var queueSummary: OperatorActionQueueSummary?
    @Published var morningDigest: MorningRecoveryDigestResponse?

    private let api: APIClient
    private var operatorRefreshTokens = Set<AnyCancellable>()

    init(api: APIClient) {
        self.api = api

        NotificationCenter.default.publisher(for: OperatorRefreshNotifications.slotUpdated)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                guard let self else { return }
                Task { await self.load(silent: true) }
            }
            .store(in: &operatorRefreshTokens)

        NotificationCenter.default.publisher(for: OperatorRefreshNotifications.slotNoteUpdated)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                guard let self else { return }
                Task { await self.load(silent: true) }
            }
            .store(in: &operatorRefreshTokens)
    }

    func load(silent: Bool = false) async {
        if !silent || (dailySummary == nil && queueSummary == nil) {
            loadState = .loading
        }

        do {
            async let daily = api.getOperatorDailyOpsSummary()
            async let queue = api.getOperatorActionQueue()
            async let digest = api.getMorningRecoveryDigestIfAvailable()

            let dailyRes = try await daily
            let queueRes = try await queue
            let digestRes = await digest

            dailySummary = dailyRes
            queueSummary = queueRes.summary
            morningDigest = digestRes
            loadState = .loaded
        } catch {
            if dailySummary == nil && queueSummary == nil {
                loadState = .failed(APIErrorCopy.message(for: error))
            } else {
                loadState = .loaded
            }
        }
    }

    func refresh() async {
        await load(silent: true)
    }
}
