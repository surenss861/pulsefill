import Combine
import Foundation

private enum OperatorSlotsFilterStorage {
    static let providerId = "pf.operator.slots.filter.providerId"
    static let locationId = "pf.operator.slots.filter.locationId"
    static let serviceId = "pf.operator.slots.filter.serviceId"
}

@MainActor
final class OperatorSlotsListViewModel: ObservableObject {
    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    @Published var loadState: LoadState = .idle
    @Published var slots: [StaffOpenSlotListRow] = []
    @Published var selectedFilter: OperatorSlotsFilter = .all
    @Published var flashMessage: String?
    @Published var performingSlotId: String?

    @Published var filterProviderId: String?
    @Published var filterLocationId: String?
    @Published var filterServiceId: String?

    @Published var providerOptions: [BusinessNamedRow] = []
    @Published var locationOptions: [BusinessNamedRow] = []
    @Published var serviceOptions: [BusinessNamedRow] = []
    @Published var filterOptionsLoading = false

    private let api: APIClient

    init(api: APIClient) {
        self.api = api
        filterProviderId = UserDefaults.standard.string(forKey: OperatorSlotsFilterStorage.providerId)
        filterLocationId = UserDefaults.standard.string(forKey: OperatorSlotsFilterStorage.locationId)
        filterServiceId = UserDefaults.standard.string(forKey: OperatorSlotsFilterStorage.serviceId)
    }

    private func persistFilters() {
        persistOptional(filterProviderId, key: OperatorSlotsFilterStorage.providerId)
        persistOptional(filterLocationId, key: OperatorSlotsFilterStorage.locationId)
        persistOptional(filterServiceId, key: OperatorSlotsFilterStorage.serviceId)
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

    func load() async {
        if slots.isEmpty {
            loadState = .loading
        }

        filterOptionsLoading = true
        defer { filterOptionsLoading = false }

        do {
            async let slotsTask = api.getStaffOpenSlots()
            async let providersTask = api.getBusinessNamedProviders()
            async let locationsTask = api.getBusinessNamedLocations()
            async let servicesTask = api.getBusinessNamedServices()

            let (response, providers, locations, services) = try await (slotsTask, providersTask, locationsTask, servicesTask)
            slots = response.openSlots.sorted { $0.startsAt < $1.startsAt }
            providerOptions = providers
            locationOptions = locations
            serviceOptions = services
            loadState = .loaded
        } catch {
            if slots.isEmpty {
                loadState = .failed(APIErrorCopy.message(for: error))
            } else {
                flashMessage = APIErrorCopy.message(for: error)
            }
        }
    }

    func refresh() async {
        await load()
    }

    private func matchesEntityFilters(_ slot: StaffOpenSlotListRow) -> Bool {
        if let p = filterProviderId, slot.providerId != p { return false }
        if let l = filterLocationId, slot.locationId != l { return false }
        if let s = filterServiceId, slot.serviceId != s { return false }
        return true
    }

    var filteredSlots: [StaffOpenSlotListRow] {
        slots.filter { selectedFilter.matches(status: $0.status) && matchesEntityFilters($0) }
    }

    var counts: [String: Int] {
        Dictionary(grouping: slots, by: { $0.status.lowercased() }).mapValues(\.count)
    }

    func primaryAction(for slot: StaffOpenSlotListRow) -> OperatorPrimaryAction? {
        OperatorPrimaryActionDeriver.forSlot(status: slot.status, winningClaimId: slot.winningClaim?.id)
    }

    func performPrimaryAction(for slot: StaffOpenSlotListRow) async {
        guard let action = primaryAction(for: slot) else { return }

        performingSlotId = slot.id
        defer { performingSlotId = nil }

        do {
            let msg = try await OperatorInlineActionRunner(api: api).run(action, openSlotId: slot.id)
            flashMessage = msg

            await load()
        } catch {
            flashMessage = APIErrorCopy.message(for: error)
        }
    }
}
