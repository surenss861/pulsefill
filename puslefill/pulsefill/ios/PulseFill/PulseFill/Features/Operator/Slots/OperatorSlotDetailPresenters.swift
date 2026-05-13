import Foundation

/// Copy + summaries for slot detail timelines and guidance (operator-only).
enum OperatorSlotDetailPresenters {
    static func nextActionTitle(for status: String) -> String {
        switch status.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {
        case "claimed":
            return "Confirm booking"
        case "open":
            return "Send offers"
        case "offered":
            return "Retry or wait"
        case "booked":
            return "Booking confirmed"
        case "expired":
            return "Expired"
        case "cancelled", "canceled":
            return "Cancelled"
        default:
            return "Next step"
        }
    }

    static func nextActionDescription(for status: String) -> String {
        switch status.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {
        case "claimed":
            return "Verify the claimant and confirm the booking once you’re satisfied."
        case "open":
            return "Send offers so waiting customers see this cancelled time."
        case "offered":
            return "Offers are out. Wait for replies, or retry from the actions below if delivery looks weak."
        case "booked":
            return "This time is booked. Review your internal note if you need context for the desk."
        case "expired", "cancelled", "canceled":
            return "Nothing else to do here."
        default:
            return OperatorOpeningStatusCopy.label(forRawStatus: status)
        }
    }

    static func latestMilestone(_ events: [OperatorTimelineEvent]) -> String? {
        guard let first = events.first else { return nil }
        let when = DateFormatterPF.medium(first.createdAt)
        let title = timelineEventTitle(for: first.eventType)
        return "\(title) · \(when)"
    }

    static func lastTouchedSummary(for slot: StaffOpenSlotDetail) -> String? {
        guard let touched = slot.lastTouchedAt?.trimmingCharacters(in: .whitespacesAndNewlines), !touched.isEmpty
        else {
            return nil
        }

        let when = DateFormatterPF.relative(touched)
        if when.isEmpty { return nil }

        let actor = slot.lastTouchedBy?.fullName?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let suffix: String = {
            if let actor, !actor.isEmpty { return actor }
            let idTail = slot.lastTouchedByStaffId.map(Self.shortId(_:))
            return idTail ?? "Staff"
        }()

        return "Last updated \(when) · \(suffix)"
    }

    static func offerOutcomeSummary(_ offers: [StaffSlotOfferRow]) -> String {
        guard !offers.isEmpty else {
            return "Offers will appear once you send to waiting customers."
        }

        var counts: [String: Int] = [:]
        for o in offers {
            let k = o.status.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            counts[k, default: 0] += 1
        }

        func label(_ raw: String) -> String {
            switch raw.lowercased() {
            case "sent", "queued": return "Queued"
            case "delivered": return "Delivered"
            case "failed": return "Delivery failed"
            case "opened", "viewed": return "Viewed"
            case "expired": return "Expired offer"
            case "skipped": return "Skipped"
            default:
                return raw.replacingOccurrences(of: "_", with: " ").capitalized
            }
        }

        let chunks = counts.keys.sorted().map { key in
            "\(counts[key] ?? 0) \(label(key))"
        }
        return chunks.joined(separator: " · ")
    }

    static func timelineEventTitle(for eventType: String) -> String {
        switch eventType.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {
        case "slot.created", "open_slot.created":
            return "Opening posted"
        case "offers.sent", "send_offers":
            return "Offers sent"
        case "offers.retry", "offers.retried":
            return "Offers retried"
        case "offer.delivered":
            return "Delivery updated"
        case "offer.failed":
            return "Delivery issue"
        case "claim.created", "claim.submitted":
            return "Customer claimed"
        case "booking.confirmed", "claim.confirmed", "confirmed":
            return "Booking confirmed"
        case "slot.expired":
            return "Opening expired"
        case "slot.cancelled", "slot.canceled":
            return "Opening cancelled"
        default:
            return eventType.replacingOccurrences(of: ".", with: " ").replacingOccurrences(of: "_", with: " ").capitalized
        }
    }

    static func timelineActorLine(for event: OperatorTimelineEvent) -> String? {
        if let actor = event.actorLabel?.trimmingCharacters(in: .whitespacesAndNewlines), !actor.isEmpty {
            return actor
        }
        if let actorType = event.actorType?.trimmingCharacters(in: .whitespacesAndNewlines), !actorType.isEmpty {
            let kind = actorType.replacingOccurrences(of: "_", with: " ").capitalized
            if let id = event.actorId { return "\(kind) · \(Self.shortId(id))" }
            return kind
        }
        if let id = event.actorId { return Self.shortId(id) }
        return nil
    }

    nonisolated private static func shortId(_ id: String) -> String {
        if id.count <= 14 { return id }
        return "\(id.prefix(4))…\(id.suffix(4))"
    }
}
