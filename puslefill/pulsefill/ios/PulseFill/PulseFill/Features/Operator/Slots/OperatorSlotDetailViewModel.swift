import Combine
import Foundation

@MainActor
final class OperatorSlotDetailViewModel: ObservableObject {
    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    @Published var loadState: LoadState = .idle
    @Published var slot: StaffOpenSlotDetail?
    @Published var timeline: [OperatorTimelineEvent] = []
    @Published var notificationLogs: [OperatorNotificationLogRow] = []
    @Published var isRetrying = false
    @Published var isConfirming = false
    @Published var flashMessage: String?

    private let api: APIClient
    private let slotId: String

    init(api: APIClient, slotId: String) {
        self.api = api
        self.slotId = slotId
    }

    func load() async {
        if slot == nil {
            loadState = .loading
        }
        do {
            async let detail = api.getOpenSlotDetail(slotId: slotId)
            async let tl = api.getSlotTimeline(slotId: slotId)
            async let logs = api.getSlotNotificationLogs(slotId: slotId)
            let (d, t, l) = try await (detail, tl, logs)
            slot = d.slot
            timeline = t.events
            notificationLogs = l.logs
            loadState = .loaded
        } catch {
            if slot == nil {
                loadState = .failed(APIErrorCopy.message(for: error))
            } else {
                flashMessage = APIErrorCopy.message(for: error)
            }
        }
    }

    func refresh() async {
        await load()
    }

    func retryOffers() async {
        guard let slot else { return }
        guard slot.status == "open" || slot.status == "offered" else { return }
        isRetrying = true
        defer { isRetrying = false }
        do {
            _ = try await api.sendOffers(slotId: slot.id)
            flashMessage = "Offers sent."
            await load()
        } catch {
            flashMessage = APIErrorCopy.message(for: error)
        }
    }

    func confirmBooking() async {
        guard let slot, let claimId = slot.winningClaim?.id else { return }
        isConfirming = true
        defer { isConfirming = false }
        do {
            _ = try await api.confirmOpenSlotClaim(slotId: slot.id, claimId: claimId)
            flashMessage = "Booking confirmed."
            await load()
        } catch {
            flashMessage = APIErrorCopy.message(for: error)
        }
    }

    var hasAttentionCues: Bool {
        guard let slot else { return false }
        let failedOffers = (slot.slotOffers ?? []).contains { $0.status == "failed" }
        let failedLogs = notificationLogs.contains { $0.status == "failed" }
        return failedOffers || failedLogs
    }
}
