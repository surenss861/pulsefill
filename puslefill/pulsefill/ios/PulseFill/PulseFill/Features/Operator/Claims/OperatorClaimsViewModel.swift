import Combine
import Foundation

// MARK: - Row model

struct OperatorClaimListItem: Identifiable, Hashable {
    /// Stable handle for animations / identity.
    let id: String
    let claimId: String
    let openSlotId: String

    /// Open-slot lifecycle status (opening chip).
    let slotStatus: String
    let startsAt: String
    let endsAt: String

    /// Display service name when roster returns it.
    let serviceDisplayLine: String
    let providerNameSnapshot: String?
    let claim: WinningClaimRow

    var primaryTitle: String {
        serviceDisplayLine
    }

    var providerLine: String? {
        guard let snapshot = providerNameSnapshot?.trimmingCharacters(in: .whitespacesAndNewlines),
              !snapshot.isEmpty
        else {
            return nil
        }
        return snapshot
    }

    var customerLine: String {
        let trimmed = claim.customerId.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return "Customer —"
        }
        if trimmed.count <= 14 {
            return "Customer · \(trimmed)"
        }
        return "Customer · \(trimmed.prefix(4))…\(trimmed.suffix(4))"
    }

    /// "Claimed · …" relative line when API provides `claimed_at`.
    var claimedRelativeLine: String? {
        guard let raw = claim.claimedAt?.trimmingCharacters(in: .whitespacesAndNewlines), !raw.isEmpty,
              let date = DateFormatterPF.parseToDate(raw)
        else {
            return nil
        }
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .abbreviated
        return "Claimed \(f.localizedString(for: date, relativeTo: Date()))"
    }

    var bucket: OperatorClaimsViewModel.RowBucket {
        OperatorClaimsViewModel.RowBucket.bucket(slotStatus: slotStatus)
    }

    static func makeIfPossible(row: StaffOpenSlotListRow, serviceNames: [String: String]) -> OperatorClaimListItem? {
        guard let claim = row.winningClaim else { return nil }
        let serviceLine: String
        if let sid = row.serviceId, let human = serviceNames[sid]?.trimmingCharacters(in: .whitespacesAndNewlines), !human.isEmpty {
            serviceLine = human
        } else if let sid = row.serviceId?.trimmingCharacters(in: .whitespacesAndNewlines), !sid.isEmpty {
            serviceLine = "Service \(Self.compactToken(sid))"
        } else {
            serviceLine = "Cancellation opening"
        }
        let cid = claim.id
        let slotId = row.id
        return OperatorClaimListItem(
            id: "\(slotId)#\(cid)",
            claimId: cid,
            openSlotId: slotId,
            slotStatus: row.status,
            startsAt: row.startsAt,
            endsAt: row.endsAt,
            serviceDisplayLine: serviceLine,
            providerNameSnapshot: row.providerNameSnapshot,
            claim: claim
        )
    }

    private static func compactToken(_ id: String) -> String {
        if id.count <= 14 { return id }
        return "\(id.prefix(4))…\(id.suffix(4))"
    }
}

// MARK: - View model

@MainActor
final class OperatorClaimsViewModel: ObservableObject {
    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    enum RowBucket {
        case needsConfirmation
        case recentlyConfirmed
        case closed

        static func bucket(slotStatus raw: String) -> RowBucket {
            let status = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            if status == "claimed" {
                return .needsConfirmation
            }
            if status == "booked" {
                return .recentlyConfirmed
            }
            return .closed
        }
    }

    @Published private(set) var loadState: LoadState = .idle
    @Published private(set) var didLoadOnce = false
    @Published var needsConfirmation: [OperatorClaimListItem] = []
    @Published var recentlyConfirmed: [OperatorClaimListItem] = []
    @Published var closed: [OperatorClaimListItem] = []

    /// Primary key for concurrency guard + row spinners (`WinningClaimRow.id`).
    @Published var confirmingClaimId: String?
    @Published var flashMessage: String?
    @Published var confirmFailurePrompt: ConfirmFailurePrompt?

    /// Best-effort headlines from `/customers/:id/context` for human-readable claim rows.
    @Published private(set) var customerHeadlineByCustomerId: [String: String] = [:]

    struct ConfirmFailurePrompt: Identifiable {
        let id = UUID()
        let item: OperatorClaimListItem
    }

    private let businessAPI: BusinessOperatorAPIClient
    private var cancellables = Set<AnyCancellable>()

    init(businessAPI: BusinessOperatorAPIClient) {
        self.businessAPI = businessAPI

        NotificationCenter.default.publisher(for: OperatorRefreshNotifications.slotUpdated)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                guard let self else { return }
                Task { await self.refresh() }
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: OperatorRefreshNotifications.slotNoteUpdated)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                guard let self else { return }
                Task { await self.refresh() }
            }
            .store(in: &cancellables)
    }

    var needsConfirmationCount: Int { needsConfirmation.count }
    var recentlyConfirmedCount: Int { recentlyConfirmed.count }
    var closedCount: Int { closed.count }

    func load() async {
        if !didLoadOnce {
            loadState = .loading
        }
        do {
            async let bundle = businessAPI.listMyOpenSlots()
            async let services = businessAPI.namedServices()
            let (slotsResponse, svcRows) = try await (bundle, services)

            let nameMap = Dictionary(uniqueKeysWithValues: svcRows.map {
                ($0.id, $0.name.trimmingCharacters(in: .whitespacesAndNewlines))
            })
            reconstruct(from: slotsResponse.openSlots, serviceNames: nameMap)

            loadState = .loaded
            didLoadOnce = true
        } catch {
            let message = APIErrorCopy.message(for: error)
            if !didLoadOnce {
                loadState = .failed(message)
            } else {
                flashMessage = message
                loadState = .loaded
            }
        }
    }

    func refresh() async {
        await load()
    }

    func confirmBooking(_ item: OperatorClaimListItem) async {
        guard confirmingClaimId == nil else { return }
        confirmingClaimId = item.claimId
        defer { confirmingClaimId = nil }

        do {
            let res = try await businessAPI.confirmOpenSlotClaim(slotId: item.openSlotId, claimId: item.claimId)
            let trimmed = res.message?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            if trimmed.isEmpty {
                flashMessage = res.result == "already_confirmed" ? "This booking was already confirmed." : "Booking confirmed."
            } else {
                flashMessage = trimmed
            }
            PFHaptics.success()
            OperatorMutationNotifier.postSlotUpdated(slotId: item.openSlotId, action: .confirmBooking)
            await reloadSilentlyPreferringSuccess()
        } catch {
            if isOperatorActionConflict(error) {
                flashMessage = "This opening changed — refreshed the list."
                await reloadSilentlyPreferringSuccess()
            } else {
                confirmFailurePrompt = ConfirmFailurePrompt(item: item)
            }
        }
    }

    func retryFailedConfirmation() async {
        guard let candidate = confirmFailurePrompt?.item else { return }
        confirmFailurePrompt = nil
        await refresh()
        await confirmBooking(candidate)
    }

    func clearConfirmFailure() {
        confirmFailurePrompt = nil
    }

    func hydratedCustomerLine(for item: OperatorClaimListItem) -> String {
        if let h = customerHeadlineByCustomerId[item.claim.customerId], !h.isEmpty {
            return h
        }
        return item.customerLine
    }

    private func hydrateCustomerHeadlines(for items: [OperatorClaimListItem]) async {
        let uniqueIds = Array(Set(items.map(\.claim.customerId)))
        for customerId in uniqueIds.prefix(14) {
            if customerHeadlineByCustomerId[customerId] != nil { continue }
            guard let ctx = try? await businessAPI.operatorCustomerContext(customerId: customerId) else { continue }
            let c = ctx.customer
            let composed: String?
            if let name = c.displayName?.trimmingCharacters(in: .whitespacesAndNewlines), !name.isEmpty {
                composed = "Customer · \(name)"
            } else if let email = c.emailMasked?.trimmingCharacters(in: .whitespacesAndNewlines), !email.isEmpty {
                composed = "Customer · \(email)"
            } else if let phone = c.phoneMasked?.trimmingCharacters(in: .whitespacesAndNewlines), !phone.isEmpty {
                composed = "Customer · \(phone)"
            } else {
                composed = nil
            }
            guard let composed else { continue }
            customerHeadlineByCustomerId[customerId] = composed
        }
    }

    private func reloadSilentlyPreferringSuccess() async {
        do {
            async let bundle = businessAPI.listMyOpenSlots()
            async let services = businessAPI.namedServices()
            let (slotsResponse, svcRows) = try await (bundle, services)
            let nameMap = Dictionary(uniqueKeysWithValues: svcRows.map {
                ($0.id, $0.name.trimmingCharacters(in: .whitespacesAndNewlines))
            })
            reconstruct(from: slotsResponse.openSlots, serviceNames: nameMap)
        } catch {
            flashMessage = APIErrorCopy.message(for: error)
        }
    }

    private func reconstruct(from rows: [StaffOpenSlotListRow], serviceNames: [String: String]) {
        let items = rows.compactMap { OperatorClaimListItem.makeIfPossible(row: $0, serviceNames: serviceNames) }

        let visibleCustomerIds = Set(items.map(\.claim.customerId))
        customerHeadlineByCustomerId = customerHeadlineByCustomerId.filter { visibleCustomerIds.contains($0.key) }

        let needs = items
            .filter { $0.bucket == .needsConfirmation }
            .sorted { Self.claimTimelineSort($0, $1, preferOlderFirst: true) }

        let recent = items
            .filter { $0.bucket == .recentlyConfirmed }
            .sorted { Self.slotRecencySort($0, $1) }

        let closedItems = items
            .filter { $0.bucket == .closed }
            .sorted { Self.slotRecencySort($0, $1) }

        needsConfirmation = needs
        recentlyConfirmed = Array(recent.prefix(25))
        closed = Array(closedItems.prefix(25))

        Task { await hydrateCustomerHeadlines(for: needs + recentlyConfirmed + closed) }
    }

    /// Confirmation queue: prioritize older claims first.
    private static func claimTimelineSort(_ a: OperatorClaimListItem, _ b: OperatorClaimListItem, preferOlderFirst: Bool) -> Bool {
        func key(_ item: OperatorClaimListItem) -> Date {
            if let iso = item.claim.claimedAt {
                let d = DateFormatterPF.parseToDate(iso)
                return d ?? (preferOlderFirst ? .distantFuture : .distantPast)
            }
            let slotKey = DateFormatterPF.parseToDate(item.startsAt) ?? .distantFuture
            return slotKey
        }
        let ka = key(a)
        let kb = key(b)
        return preferOlderFirst ? (ka < kb) : (ka > kb)
    }

    private static func slotRecencySort(_ a: OperatorClaimListItem, _ b: OperatorClaimListItem) -> Bool {
        let ea = DateFormatterPF.parseToDate(a.endsAt) ?? .distantPast
        let eb = DateFormatterPF.parseToDate(b.endsAt) ?? .distantPast
        return ea > eb
    }

    private func isOperatorActionConflict(_ error: Error) -> Bool {
        guard let apiErr = error as? APIError else { return false }
        if case let .structured(statusCode, code, _, _, _) = apiErr {
            return statusCode == 409 && code == "operator_action_not_allowed"
        }
        return false
    }
}
