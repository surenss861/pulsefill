import Foundation

@MainActor
struct OperatorInlineActionRunner {
    let api: APIClient

    /// Returns API `message` when present (parity with web success toasts).
    func run(_ action: OperatorPrimaryAction, openSlotId: String) async throws -> String {
        switch action.kind {
        case .sendOffers, .retryOffers:
            let r = try await api.sendOffers(slotId: openSlotId)
            let trimmed = r.message?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            if !trimmed.isEmpty { return trimmed }
            return defaultSendMessage(result: r.result, kind: action.kind)

        case .confirmBooking:
            guard let claimId = action.claimId else {
                throw NSError(
                    domain: "OperatorInlineActionRunner",
                    code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "Missing winning claim ID."]
                )
            }
            let r = try await api.confirmOpenSlotClaim(slotId: openSlotId, claimId: claimId)
            let trimmed = r.message?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            if !trimmed.isEmpty { return trimmed }
            if r.result == "already_confirmed" {
                return "This booking was already confirmed."
            }
            return "Booking confirmed."
        }
    }

    private func defaultSendMessage(result: String?, kind: OperatorInlineActionKind) -> String {
        if result == "no_matches" {
            return "No matching standby customers were found."
        }
        switch kind {
        case .sendOffers:
            return "Offers sent."
        case .retryOffers:
            return "Offers retried."
        case .confirmBooking:
            return "Booking confirmed."
        }
    }
}
