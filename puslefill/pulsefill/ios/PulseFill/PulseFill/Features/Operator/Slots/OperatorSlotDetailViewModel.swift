import Combine
import Foundation

@MainActor
final class OperatorSlotDetailViewModel: ObservableObject {
    enum PendingAction: Equatable {
        case confirmBooking
        case sendOffers
        case retryOffers
        case expireSlot
        case cancelSlot
        case saveNote
    }
    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    @Published var loadState: LoadState = .idle
    @Published var slot: StaffOpenSlotDetail?
    @Published var queueContext: OperatorSlotQueueContext?
    @Published var availableActions: [OperatorSlotAvailableAction] = []
    @Published var customerContext: OperatorCustomerContextResponse?
    @Published var timeline: [OperatorTimelineEvent] = []
    @Published var notificationLogs: [OperatorNotificationLogRow] = []
    @Published var isRetrying = false
    @Published var isConfirming = false
    @Published var isSavingNote = false
    @Published var isExpiring = false
    @Published var isCancelling = false
    @Published var flashMessage: String?
    @Published var errorMessage: String?
    @Published var pendingAction: PendingAction?
    @Published var successPulseToken = UUID()

    private let api: APIClient
    private let slotId: String

    init(api: APIClient, slotId: String) {
        self.api = api
        self.slotId = slotId
    }

    var sortedActions: [OperatorSlotAvailableAction] {
        availableActions.sorted { $0.sortIndex < $1.sortIndex }
    }

    var primaryRowActions: [OperatorSlotAvailableAction] {
        let mutating = sortedActions.filter { !$0.isUtility }
        return Array(mutating.prefix(2))
    }

    var secondaryRowActions: [OperatorSlotAvailableAction] {
        let mutating = sortedActions.filter { !$0.isUtility }
        let tail = Array(mutating.dropFirst(2))
        let utils = sortedActions.filter(\.isUtility)
        return tail + utils
    }

    /// When the API omits the new contract fields, keep legacy status-based actions.
    var usesServerActionMatrix: Bool {
        if !availableActions.isEmpty { return true }
        if let t = queueContext?.reasonTitle, !t.isEmpty { return true }
        return false
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
            queueContext = d.queueContext
            availableActions = d.availableActions ?? []
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

    func runAvailableAction(_ action: OperatorSlotAvailableAction) async {
        guard let slot else { return }
        switch action {
        case .confirmBooking:
            await confirmBooking()
        case .retryOffers, .sendOffers:
            await retryOffers(for: action)
        case .expireSlot:
            await expireSlot()
        case .cancelSlot:
            await cancelSlot()
        case .addNote, .inspectNotificationLogs:
            break
        }
    }

    /// Legacy / convenience path (infers send vs retry from slot status).
    func retryOffers() async {
        guard let slot else { return }
        let action: OperatorSlotAvailableAction = slot.status == "offered" ? .retryOffers : .sendOffers
        await retryOffers(for: action)
    }

    func retryOffers(for action: OperatorSlotAvailableAction) async {
        guard let slot else { return }
        guard slot.status == "open" || slot.status == "offered" else { return }
        let pending: PendingAction = action == .retryOffers ? .retryOffers : .sendOffers
        guard begin(pending) else { return }
        isRetrying = true
        defer {
            isRetrying = false
            end()
        }
        do {
            let res = try await api.sendOffers(slotId: slot.id)
            let refresh: OperatorMutationRefreshAction = action == .retryOffers ? .retryOffers : .sendOffers
            let trimmed = res.message?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            let msg: String
            if !trimmed.isEmpty {
                msg = trimmed
            } else if res.result == "no_matches" {
                msg = "No matching standby customers were found."
            } else {
                msg = action == .retryOffers || slot.status == "offered" ? "Offers retried." : "Offers sent."
            }
            await markSuccess(message: msg, slotId: slot.id, refreshAction: refresh)
        } catch {
            await handleMutationError(error)
        }
    }

    func saveInternalNote(note: String, resolutionStatus: String) async {
        guard let slot else { return }
        guard begin(.saveNote) else { return }
        isSavingNote = true
        defer {
            isSavingNote = false
            end()
        }
        do {
            let res = try await api.updateOperatorSlotNote(
                slotId: slot.id,
                internalNote: note,
                resolutionStatus: resolutionStatus
            )
            self.slot = slot.applyingSavedNote(res)
            let trimmed = res.message.trimmingCharacters(in: .whitespacesAndNewlines)
            let msg = trimmed.isEmpty ? "Internal note saved." : trimmed
            await markSuccess(message: msg, slotId: slot.id, noteUpdated: true)
        } catch {
            errorMessage = APIErrorCopy.message(for: error)
            flashMessage = errorMessage
        }
    }

    func confirmBooking() async {
        guard let slot, let claimId = slot.winningClaim?.id else { return }
        guard begin(.confirmBooking) else { return }
        isConfirming = true
        defer {
            isConfirming = false
            end()
        }
        do {
            let res = try await api.confirmOpenSlotClaim(slotId: slot.id, claimId: claimId)
            let trimmed = res.message?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            let msg: String
            if trimmed.isEmpty {
                msg = res.result == "already_confirmed" ? "This booking was already confirmed." : "Booking confirmed."
            } else {
                msg = trimmed
            }
            await markSuccess(message: msg, slotId: slot.id, refreshAction: .confirmBooking)
        } catch {
            await handleMutationError(error)
        }
    }

    func expireSlot() async {
        guard let slot else { return }
        guard begin(.expireSlot) else { return }
        isExpiring = true
        defer {
            isExpiring = false
            end()
        }
        do {
            _ = try await api.expireOpenSlot(slotId: slot.id)
            await markSuccess(message: "Slot expired.", slotId: slot.id, refreshAction: .expireSlot)
        } catch {
            await handleMutationError(error)
        }
    }

    func cancelSlot() async {
        guard let slot else { return }
        guard begin(.cancelSlot) else { return }
        isCancelling = true
        defer {
            isCancelling = false
            end()
        }
        do {
            _ = try await api.cancelOpenSlot(slotId: slot.id)
            await markSuccess(message: "Slot cancelled.", slotId: slot.id, refreshAction: .cancelSlot)
        } catch {
            await handleMutationError(error)
        }
    }

    var hasAttentionCues: Bool {
        guard let slot else { return false }
        let failedOffers = (slot.slotOffers ?? []).contains { $0.status == "failed" }
        let failedLogs = notificationLogs.contains { $0.status == "failed" }
        return failedOffers || failedLogs
    }

    private func handleMutationError(_ error: Error) async {
        if isOperatorActionConflict(error) {
            flashMessage = "This opening changed — refreshed latest state."
            errorMessage = flashMessage
            await load()
        } else {
            errorMessage = APIErrorCopy.message(for: error)
            flashMessage = errorMessage
        }
    }


    private func begin(_ action: PendingAction) -> Bool {
        guard pendingAction == nil else { return false }
        pendingAction = action
        errorMessage = nil
        return true
    }

    private func end() {
        pendingAction = nil
    }

    private func markSuccess(
        message: String,
        slotId: String,
        refreshAction: OperatorMutationRefreshAction? = nil,
        noteUpdated: Bool = false
    ) async {
        flashMessage = message
        successPulseToken = UUID()
        if noteUpdated {
            OperatorMutationNotifier.postSlotNoteUpdated(slotId: slotId)
        } else if let refreshAction {
            OperatorMutationNotifier.postSlotUpdated(slotId: slotId, action: refreshAction)
        }
        await load()
    }

    private func isOperatorActionConflict(_ error: Error) -> Bool {
        guard let apiErr = error as? APIError else { return false }
        if case let .structured(statusCode, code, _, _) = apiErr {
            return statusCode == 409 && code == "operator_action_not_allowed"
        }
        return false
    }
}
