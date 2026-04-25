import Combine
import Foundation

private enum OperatorQueueFilterStorage {
    static let providerId = "pf.operator.queue.filter.providerId"
    static let locationId = "pf.operator.queue.filter.locationId"
    static let serviceId = "pf.operator.queue.filter.serviceId"
}

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
    @Published var dailySummary: OperatorDailyOpsSummaryResponse?
    @Published var opsBreakdown: OperatorOpsBreakdownResponse?
    @Published var deliveryReliability: OperatorDeliveryReliabilityResponse?
    @Published var morningDigest: MorningRecoveryDigestResponse?
    @Published var selectedFilter: OperatorQueueFilter = .all
    @Published var lastUpdatedAt: Date?
    @Published var isRefreshing = false
    @Published var performingItemId: String?
    @Published var flashMessage: String?
    @Published var errorMessage: String?
    @Published var successPulseItemId: String?
    @Published var successPulseTick = 0

    @Published var filterProviderId: String?
    @Published var filterLocationId: String?
    @Published var filterServiceId: String?

    @Published var providerOptions: [BusinessNamedRow] = []
    @Published var locationOptions: [BusinessNamedRow] = []
    @Published var serviceOptions: [BusinessNamedRow] = []
    @Published var filterOptionsLoading = false

    private let api: APIClient
    private var operatorRefreshTokens = Set<AnyCancellable>()

    init(api: APIClient) {
        self.api = api
        filterProviderId = UserDefaults.standard.string(forKey: OperatorQueueFilterStorage.providerId)
        filterLocationId = UserDefaults.standard.string(forKey: OperatorQueueFilterStorage.locationId)
        filterServiceId = UserDefaults.standard.string(forKey: OperatorQueueFilterStorage.serviceId)

        NotificationCenter.default.publisher(for: OperatorRefreshNotifications.slotUpdated)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                guard let self else { return }
                Task { await self.load(silent: true) }
            }
            .store(in: &operatorRefreshTokens)
    }

    private func persistFilters() {
        persistOptional(filterProviderId, key: OperatorQueueFilterStorage.providerId)
        persistOptional(filterLocationId, key: OperatorQueueFilterStorage.locationId)
        persistOptional(filterServiceId, key: OperatorQueueFilterStorage.serviceId)
    }

    private func persistOptional(_ value: String?, key: String) {
        if let value, !value.isEmpty {
            UserDefaults.standard.set(value, forKey: key)
        } else {
            UserDefaults.standard.removeObject(forKey: key)
        }
    }

    func setFilterProviderId(_ id: String?) {
        filterProviderId = id
        persistFilters()
    }

    func setFilterLocationId(_ id: String?) {
        filterLocationId = id
        persistFilters()
    }

    func setFilterServiceId(_ id: String?) {
        filterServiceId = id
        persistFilters()
    }

    private func matchesEntityFilter(_ item: OperatorActionQueueItem) -> Bool {
        if let p = filterProviderId, item.providerId != p { return false }
        if let l = filterLocationId, item.locationId != l { return false }
        if let s = filterServiceId, item.serviceId != s { return false }
        return true
    }

    func load(silent: Bool = false) async {
        if !silent, response == nil {
            loadState = .loading
        }
        filterOptionsLoading = true
        defer { filterOptionsLoading = false }
        do {
            async let queueTask = api.getOperatorActionQueue()
            async let summaryTask = api.getOperatorDailyOpsSummary()
            async let breakdownTask = api.getOperatorOpsBreakdown()
            async let deliveryTask = api.getOperatorDeliveryReliability()
            async let digestTask = api.getMorningRecoveryDigestIfAvailable()

            let result = try await queueTask
            let summary = try? await summaryTask
            let breakdown = try? await breakdownTask
            let delivery = try? await deliveryTask
            let digest = await digestTask

            let providers = (try? await api.getBusinessNamedProviders()) ?? []
            let locations = (try? await api.getBusinessNamedLocations()) ?? []
            let services = (try? await api.getBusinessNamedServices()) ?? []

            response = result
            dailySummary = summary
            opsBreakdown = breakdown
            deliveryReliability = delivery
            morningDigest = digest
            providerOptions = providers
            locationOptions = locations
            serviceOptions = services
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

    private func baseNeedsAction() -> [OperatorActionQueueItem] {
        switch selectedFilter {
        case .all, .needsAction: response?.sections.needsAction ?? []
        case .review, .resolved: []
        }
    }

    private func baseReview() -> [OperatorActionQueueItem] {
        switch selectedFilter {
        case .all, .review: response?.sections.review ?? []
        case .needsAction, .resolved: []
        }
    }

    private func baseResolved() -> [OperatorActionQueueItem] {
        switch selectedFilter {
        case .all, .resolved: response?.sections.resolved ?? []
        case .needsAction, .review: []
        }
    }

    var filteredNeedsAction: [OperatorActionQueueItem] {
        baseNeedsAction().filter { matchesEntityFilter($0) }
    }

    var filteredReview: [OperatorActionQueueItem] {
        baseReview().filter { matchesEntityFilter($0) }
    }

    var filteredResolved: [OperatorActionQueueItem] {
        baseResolved().filter { matchesEntityFilter($0) }
    }

    func performPrimaryAction(for item: OperatorActionQueueItem) async {
        guard let derived = OperatorPrimaryActionDeriver.queueInline(from: item) else { return }
        guard performingItemId == nil else { return }

        performingItemId = item.id
        errorMessage = nil
        defer { performingItemId = nil }

        do {
            let msg = try await OperatorInlineActionRunner(api: api).run(derived, openSlotId: item.openSlotId)
            flashMessage = msg
            successPulseItemId = item.id
            successPulseTick += 1
        } catch {
            let message = APIErrorCopy.message(for: error)
            errorMessage = message
            flashMessage = message
        }
    }
}
