import Foundation

enum OperatorInlineActionKind: Equatable {
    case confirmBooking
    case sendOffers
    case retryOffers
}

struct OperatorPrimaryAction: Equatable {
    let kind: OperatorInlineActionKind
    let label: String
    let claimId: String?
}

enum OperatorPrimaryActionDeriver {
    static func forSlot(status: String, winningClaimId: String?) -> OperatorPrimaryAction? {
        switch status.lowercased() {
        case "open":
            return OperatorPrimaryAction(kind: .sendOffers, label: "Send offers", claimId: nil)
        case "offered":
            return OperatorPrimaryAction(kind: .retryOffers, label: "Retry", claimId: nil)
        case "claimed":
            guard let winningClaimId else { return nil }
            return OperatorPrimaryAction(kind: .confirmBooking, label: "Confirm", claimId: winningClaimId)
        default:
            return nil
        }
    }

    /// Mirrors web `deriveQueueInlinePrimaryAction`: first `actions` entry wins; `view_slot` / `inspect_logs` → no inline CTA.
    static func queueInline(from item: OperatorActionQueueItem) -> OperatorPrimaryAction? {
        guard let first = item.actions.first else { return nil }

        if first == .inspectLogs || first == .viewSlot || first == .openSlot {
            return nil
        }

        let status = (item.slotStatus ?? "").lowercased()

        if first == .confirmBooking {
            guard status == "claimed", let claimId = item.claimId else { return nil }
            return OperatorPrimaryAction(kind: .confirmBooking, label: "Confirm", claimId: claimId)
        }

        if first == .retryOffers {
            if status == "open" {
                return OperatorPrimaryAction(kind: .sendOffers, label: "Send offers", claimId: nil)
            }
            if status == "offered" {
                return OperatorPrimaryAction(kind: .retryOffers, label: "Retry", claimId: nil)
            }
            return nil
        }

        return nil
    }
}
