import SwiftUI

enum OperatorSlotDetailPresenters {
    static func nextActionTitle(for status: String) -> String {
        switch status {
        case "claimed": "Confirm booking"
        case "open": "Send offers"
        case "offered": "Retry offers"
        case "booked": "Booking confirmed"
        case "expired": "Slot expired"
        case "cancelled": "Slot cancelled"
        default: "Review slot"
        }
    }

    static func nextActionDescription(for status: String) -> String {
        switch status {
        case "claimed":
            "A customer claimed this opening. Confirm it to finalize recovery."
        case "open":
            "This opening is ready to send to standby customers."
        case "offered":
            "Offers are active or can be retried if the slot still needs filling."
        case "booked":
            "This slot has already been confirmed."
        case "expired":
            "This opening expired without being filled."
        case "cancelled":
            "This opening was cancelled."
        default:
            "Review the slot details and take the next best action."
        }
    }

    static func timelineEventTitle(for eventType: String) -> String {
        switch eventType {
        case "open_slot_created", "slot_created": "Slot created"
        case "offers_sent": "Offers sent to standby customers"
        case "offers_no_match": "No matching standby customers"
        case "slot_reopened": "Slot reopened"
        case "slot_expired": "Slot expired"
        case "slot_cancelled": "Slot cancelled"
        case "slot_confirmed": "Booking confirmed"
        case "claim_won": "Customer claimed this opening"
        case "notification_delivered": "Push / notification delivered"
        case "notification_failed": "Notification delivery failed"
        case "operator_internal_note_updated": "Internal note updated"
        default:
            eventType.replacingOccurrences(of: "_", with: " ")
        }
    }

    static func timelineActorLine(for event: OperatorTimelineEvent) -> String? {
        if let label = event.actorLabel?.trimmingCharacters(in: .whitespacesAndNewlines), !label.isEmpty {
            return label
        }
        guard let t = event.actorType?.lowercased() else { return nil }
        if t == "staff" {
            if let aid = event.actorId, aid.count >= 8 {
                return "Staff · \(aid.prefix(4))…\(aid.suffix(4))"
            }
            return "Staff"
        }
        if t == "system" { return "System" }
        if t == "customer" { return "Customer" }
        return nil
    }

    static func lastTouchedSummary(for slot: StaffOpenSlotDetail) -> String? {
        guard let at = slot.lastTouchedAt, !at.isEmpty else { return nil }
        let who: String? = {
            if let n = slot.lastTouchedBy?.fullName?.trimmingCharacters(in: .whitespacesAndNewlines), !n.isEmpty {
                return n
            }
            if let e = slot.lastTouchedBy?.email, let local = e.split(separator: "@").first {
                return String(local)
            }
            if let id = slot.lastTouchedByStaffId {
                return "Staff \(shortId(id))"
            }
            return nil
        }()
        let time = DateFormatterPF.medium(at)
        if let who, !who.isEmpty {
            return "Last touched by \(who) · \(time)"
        }
        return "Last touched · \(time)"
    }

    private static func shortId(_ id: String) -> String {
        if id.count <= 14 { return id }
        return "\(id.prefix(4))…\(id.suffix(4))"
    }

    static func offerOutcomeSummary(_ offers: [StaffSlotOfferRow]) -> String {
        let total = offers.count
        let claimed = offers.filter { $0.status == "claimed" }.count
        let delivered = offers.filter { $0.status == "delivered" }.count
        let failed = offers.filter { $0.status == "failed" }.count
        let expired = offers.filter { $0.status == "expired" }.count
        return "\(total) total · \(delivered) delivered · \(failed) failed · \(expired) expired · \(claimed) claimed"
    }

    static func latestMilestone(_ events: [OperatorTimelineEvent]) -> String? {
        guard let e = events.sorted(by: { $0.createdAt > $1.createdAt }).first else { return nil }
        return timelineEventTitle(for: e.eventType)
    }
}
