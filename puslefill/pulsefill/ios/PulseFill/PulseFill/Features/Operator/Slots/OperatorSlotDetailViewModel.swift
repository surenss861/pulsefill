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
    @Published var customerContext: OperatorCustomerContextResponse?
    @Published var timeline: [OperatorTimelineEvent] = []
    @Published var notificationLogs: [OperatorNotificationLogRow] = []
    @Published var isRetrying = false
    @Published var isConfirming = false
    @Published var isSavingNote = false
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

            if let cid = d.slot.winningClaim?.customerId {
                customerContext = try? await api.getOperatorCustomerContext(customerId: cid)
            } else {
                customerContext = nil
            }

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
            let res = try await api.sendOffers(slotId: slot.id)
            let trimmed = res.message?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            if !trimmed.isEmpty {
                flashMessage = trimmed
            } else if res.result == "no_matches" {
                flashMessage = "No matching standby customers were found."
            } else {
                flashMessage = slot.status == "offered" ? "Offers retried." : "Offers sent."
            }
            await load()
        } catch {
            flashMessage = APIErrorCopy.message(for: error)
        }
    }

    func saveInternalNote(note: String, resolutionStatus: String) async {
        guard let slot else { return }
        isSavingNote = true
        defer { isSavingNote = false }
        do {
            let res = try await api.updateOperatorSlotNote(
                slotId: slot.id,
                internalNote: note,
                resolutionStatus: resolutionStatus
            )
            self.slot = slot.applyingSavedNote(res)
            let trimmed = res.message.trimmingCharacters(in: .whitespacesAndNewlines)
            flashMessage = trimmed.isEmpty ? "Internal note saved." : trimmed
        } catch {
            flashMessage = APIErrorCopy.message(for: error)
        }
    }

    func confirmBooking() async {
        guard let slot, let claimId = slot.winningClaim?.id else { return }
        isConfirming = true
        defer { isConfirming = false }
        do {
            let res = try await api.confirmOpenSlotClaim(slotId: slot.id, claimId: claimId)
            let trimmed = res.message?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            if trimmed.isEmpty {
                flashMessage = res.result == "already_confirmed" ? "This booking was already confirmed." : "Booking confirmed."
            } else {
                flashMessage = trimmed
            }
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
