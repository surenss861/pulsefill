import Combine
import Foundation

@MainActor
final class BusinessTodayViewModel: ObservableObject {
    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    @Published var loadState: LoadState = .idle
    @Published var dailySummary: OperatorDailyOpsSummaryResponse?
    @Published var queueResponse: OperatorActionQueueResponse?
    @Published var openSlotsList: [StaffOpenSlotListRow] = []
    @Published var morningDigest: MorningRecoveryDigestResponse?
    /// Present when `GET /v1/businesses/mine/recovery-health` succeeds with usable copy; otherwise Today synthesizes from daily + queue.
    @Published var recoveryHealth: OperatorRecoveryHealthResponse?

    private let businessAPI: BusinessOperatorAPIClient
    private var cancellables = Set<AnyCancellable>()

    init(businessAPI: BusinessOperatorAPIClient) {
        self.businessAPI = businessAPI

        NotificationCenter.default.publisher(for: OperatorRefreshNotifications.slotUpdated)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                guard let self else { return }
                Task { await self.load(silent: true) }
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: OperatorRefreshNotifications.slotNoteUpdated)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                guard let self else { return }
                Task { await self.load(silent: true) }
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: OperatorRefreshNotifications.customerInvitesChanged)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                guard let self else { return }
                Task { await self.load(silent: true) }
            }
            .store(in: &cancellables)
    }

    var queueSummary: OperatorActionQueueSummary? {
        queueResponse?.summary
    }

    var recentOpenings: [StaffOpenSlotListRow] {
        Array(
            openSlotsList
                .sorted { $0.startsAt > $1.startsAt }
                .prefix(3)
        )
    }

    var firstNeedsActionItem: OperatorActionQueueItem? {
        queueResponse?.sections.needsAction.first
    }

    func load(silent: Bool = false) async {
        if !silent || (dailySummary == nil && queueResponse == nil) {
            loadState = .loading
        }

        do {
            let bundle = try await businessAPI.loadBusinessTodayDashboard()

            dailySummary = bundle.daily
            queueResponse = bundle.queue
            openSlotsList = bundle.openSlots
            morningDigest = bundle.morningDigest
            recoveryHealth = bundle.recoveryHealth
            loadState = .loaded
        } catch {
            if dailySummary == nil && queueResponse == nil {
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
