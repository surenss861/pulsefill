import Foundation
import SwiftUI

// MARK: - Offer inbox / detail display

enum CustomerOfferDisplayStatus: Equatable {
    case readyToClaim
    case offerAvailable
    case expiresSoon
    case claimed
    case confirmed
    case expired
    case unavailable
    case unknown

    var label: String {
        switch self {
        case .readyToClaim: return "Ready to claim"
        case .offerAvailable: return "Opening available"
        case .expiresSoon: return "Ends soon"
        case .claimed: return "Waiting for confirmation"
        case .confirmed: return "Confirmed"
        case .expired: return "No longer available"
        case .unavailable: return "No longer available"
        case .unknown: return "Status unavailable"
        }
    }

    var isClaimable: Bool {
        switch self {
        case .readyToClaim, .offerAvailable, .expiresSoon:
            return true
        default:
            return false
        }
    }

    /// Status chip on the **dark glass** appointment pass (inbox / detail header).
    var pillToneOnPass: CustomerStatusPillTone {
        switch self {
        case .expiresSoon:
            return .warning
        case .readyToClaim, .offerAvailable:
            return .onCream
        default:
            return .onCream
        }
    }

    /// Status chip on **dark** section cards (past openings, status rows).
    var pillToneOnDark: CustomerStatusPillTone {
        switch self {
        case .readyToClaim, .offerAvailable:
            return .onDarkEmber
        case .expiresSoon:
            return .warning
        case .claimed:
            return .onDarkEmber
        case .confirmed:
            return .success
        case .expired, .unavailable:
            return .danger
        case .unknown:
            return .onDarkNeutral
        }
    }
}

/// Maps API offer `status` + optional expiry into customer-safe copy (never show raw backend strings in UI).
func customerOfferDisplayStatus(
    rawStatus: String?,
    expiresAt: Date?,
    now: Date = .init()
) -> CustomerOfferDisplayStatus {
    if let expiresAt, expiresAt < now {
        return .expired
    }

    if let expiresAt {
        let seconds = expiresAt.timeIntervalSince(now)
        if seconds > 0, seconds <= 60 * 60 {
            return .expiresSoon
        }
    }

    let normalized = rawStatus?.lowercased().trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

    switch normalized {
    case "sent", "delivered", "viewed", "pending":
        return .readyToClaim
    case "claimed", "claim_received", "claim_submitted", "pending_confirmation", "claim_pending_confirmation":
        return .claimed
    case "confirmed", "booking_confirmed":
        return .confirmed
    case "expired":
        return .expired
    case "cancelled", "unavailable", "claim_unavailable":
        return .unavailable
    case "":
        return .unknown
    default:
        return .offerAvailable
    }
}

func customerOfferDisplayStatus(forInbox offer: OfferInboxItem, now: Date = .init()) -> CustomerOfferDisplayStatus {
    let exp = offer.expiresAt.flatMap { CustomerStatusPresentersISO.parse($0) }
    return customerOfferDisplayStatus(rawStatus: offer.status, expiresAt: exp, now: now)
}

func customerOfferDisplayStatus(forDetail offer: CustomerOfferDetail, now: Date = .init()) -> CustomerOfferDisplayStatus {
    let exp = offer.expiresAt.flatMap { CustomerStatusPresentersISO.parse($0) }
    return customerOfferDisplayStatus(rawStatus: offer.status, expiresAt: exp, now: now)
}

// MARK: - Home spotlight (same truth layer as Openings inbox)

func homeSpotlightActionTitle(for status: CustomerOfferDisplayStatus) -> String {
    switch status {
    case .readyToClaim, .offerAvailable, .expiresSoon:
        return "View opening"
    case .claimed:
        return "View status"
    case .confirmed:
        return "View booking"
    case .expired:
        return "No longer available"
    case .unavailable:
        return "No longer available"
    case .unknown:
        return "View update"
    }
}

func homeSpotlightCanOpenOfferDetails(for status: CustomerOfferDisplayStatus) -> Bool {
    switch status {
    case .readyToClaim, .offerAvailable, .expiresSoon, .claimed, .confirmed, .unknown:
        return true
    case .expired, .unavailable:
        return false
    }
}

/// Home hero opening: claimable first (soonest start), then claimed/confirmed (latest `sentAt`), then unknown; never expired/unavailable.
func homeSpotlightPick(from offers: [OfferInboxItem], now: Date = .init()) -> (offer: OfferInboxItem, status: CustomerOfferDisplayStatus)? {
    let pairs = offers.map { ($0, customerOfferDisplayStatus(forInbox: $0, now: now)) }

    let claimable = pairs.filter { $0.1.isClaimable }
    if let pick = pickSoonestBySlotStart(claimable) {
        return pick
    }

    let tier2 = pairs.filter { $0.1 == .claimed || $0.1 == .confirmed }
    if let pick = pickLatestSentAt(tier2) {
        return pick
    }

    let tier3 = pairs.filter { $0.1 == .unknown }
    if let pick = pickLatestSentAt(tier3) {
        return pick
    }

    return nil
}

private func inboxSlotStart(_ offer: OfferInboxItem) -> Date? {
    guard let raw = offer.openSlot?.startsAt else { return nil }
    return CustomerStatusPresentersISO.parse(raw)
}

private func inboxSentAt(_ offer: OfferInboxItem) -> Date? {
    guard let raw = offer.sentAt else { return nil }
    return CustomerStatusPresentersISO.parse(raw)
}

private func pickSoonestBySlotStart(_ pairs: [(OfferInboxItem, CustomerOfferDisplayStatus)]) -> (OfferInboxItem, CustomerOfferDisplayStatus)? {
    guard !pairs.isEmpty else { return nil }
    return pairs.min { a, b in
        let da = inboxSlotStart(a.0) ?? .distantFuture
        let db = inboxSlotStart(b.0) ?? .distantFuture
        if da != db { return da < db }
        return (inboxSentAt(a.0) ?? .distantPast) > (inboxSentAt(b.0) ?? .distantPast)
    }
}

private func pickLatestSentAt(_ pairs: [(OfferInboxItem, CustomerOfferDisplayStatus)]) -> (OfferInboxItem, CustomerOfferDisplayStatus)? {
    guard !pairs.isEmpty else { return nil }
    return pairs.max { a, b in
        (inboxSentAt(a.0) ?? .distantPast) < (inboxSentAt(b.0) ?? .distantPast)
    }
}

// MARK: - Shared ISO parsing (fileprivate to this module’s presenters)

enum CustomerStatusPresentersISO {
    static func parse(_ value: String) -> Date? {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: value) { return d }
        f.formatOptions = [.withInternetDateTime]
        return f.date(from: value)
    }
}
