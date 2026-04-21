import Combine
import Foundation

@MainActor
final class OperatorClaimsViewModel: ObservableObject {
    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    @Published var loadState: LoadState = .idle
    /// After first successful fetch (even when list is empty).
    @Published private(set) var didLoadOnce = false
    @Published var claims: [OperatorClaimCardModel] = []
    @Published var selectedFilter: OperatorClaimsFilter = .all
    @Published var isRefreshing = false
    @Published var confirmingClaimId: String?
    @Published var flashMessage: String?

    private let api: APIClient
    private var operatorRefreshTokens = Set<AnyCancellable>()

    init(api: APIClient) {
        self.api = api

        NotificationCenter.default.publisher(for: OperatorRefreshNotifications.slotUpdated)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                guard let self else { return }
                Task { await self.load() }
            }
            .store(in: &operatorRefreshTokens)

        NotificationCenter.default.publisher(for: OperatorRefreshNotifications.slotNoteUpdated)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                guard let self else { return }
                Task { await self.load() }
            }
            .store(in: &operatorRefreshTokens)
    }

    func load() async {
        if claims.isEmpty {
            loadState = .loading
        }
        do {
            let response = try await api.getStaffOpenSlots()
            claims = response.openSlots.compactMap(OperatorClaimCardModel.from(row:))
                .sorted { $0.startsAt < $1.startsAt }
            loadState = .loaded
            didLoadOnce = true
        } catch {
            if claims.isEmpty {
                loadState = .failed(APIErrorCopy.message(for: error))
            } else {
                flashMessage = APIErrorCopy.message(for: error)
            }
            didLoadOnce = true
        }
    }

    func refresh() async {
        isRefreshing = true
        defer { isRefreshing = false }
        await load()
    }

    func confirm(_ claim: OperatorClaimCardModel) async {
        guard OperatorClaimsPresenters.isAwaiting(claim) else { return }
        confirmingClaimId = claim.claimId
        defer { confirmingClaimId = nil }
        do {
            let res = try await api.confirmOpenSlotClaim(slotId: claim.openSlotId, claimId: claim.claimId)
            OperatorMutationNotifier.postSlotUpdated(slotId: claim.openSlotId, action: .confirmBooking)
            let trimmed = res.message?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            if trimmed.isEmpty {
                flashMessage = res.result == "already_confirmed" ? "This booking was already confirmed." : "Booking confirmed."
            } else {
                flashMessage = trimmed
            }
        } catch {
            flashMessage = APIErrorCopy.message(for: error)
        }
    }

    var filteredClaims: [OperatorClaimCardModel] {
        switch selectedFilter {
        case .all: claims
        case .awaiting: claims.filter(OperatorClaimsPresenters.isAwaiting)
        case .confirmed: claims.filter(OperatorClaimsPresenters.isConfirmed)
        }
    }

    var awaitingCount: Int {
        OperatorClaimsPresenters.countAwaiting(claims)
    }

    var confirmedCount: Int {
        OperatorClaimsPresenters.countConfirmed(claims)
    }
}
