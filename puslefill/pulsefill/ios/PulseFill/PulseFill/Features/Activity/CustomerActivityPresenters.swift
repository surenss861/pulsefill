import Foundation
import SwiftUI

/// Customer-safe activity row category (maps raw API `kind` strings — never shown in UI).
enum CustomerActivityDisplayKind: Equatable {
    case openingReceived
    case claimSent
    case waitingForConfirmation
    case confirmed
    case openingNoLongerAvailable
    case standbyUpdated
    case notificationSent
    case preferencesChanged
    case businessJoined
    case unknown

    var title: String {
        switch self {
        case .openingReceived: return "Opening received"
        case .claimSent: return "Claim sent"
        case .waitingForConfirmation: return "Waiting for confirmation"
        case .confirmed: return "Confirmed"
        case .openingNoLongerAvailable: return "Opening no longer available"
        case .standbyUpdated: return "Standby updated"
        case .notificationSent: return "Notification sent"
        case .preferencesChanged: return "Preferences updated"
        case .businessJoined: return "Joined business"
        case .unknown: return "Update"
        }
    }

    /// Compact chip for timeline rows (reuses customer chip styles; labels are activity-appropriate via `title` above).
    var statusChipKind: PFCustomerOfferStatusKind {
        switch self {
        case .openingReceived: return .available
        case .claimSent: return .waiting
        case .waitingForConfirmation: return .waiting
        case .confirmed: return .confirmed
        case .openingNoLongerAvailable: return .unavailable
        case .standbyUpdated: return .active
        case .notificationSent: return .pending
        case .preferencesChanged: return .active
        case .businessJoined: return .active
        case .unknown: return .unknown
        }
    }

    /// Short chip text (row title stays the full customer sentence).
    var timelineChipCaption: String {
        switch self {
        case .openingReceived: return "Opening"
        case .claimSent: return "Claim"
        case .waitingForConfirmation: return "Pending"
        case .confirmed: return "Booked"
        case .openingNoLongerAvailable: return "Unavailable"
        case .standbyUpdated: return "Standby"
        case .notificationSent: return "Alert"
        case .preferencesChanged: return "Preferences"
        case .businessJoined: return "Joined"
        case .unknown: return "Update"
        }
    }
}

func customerActivityDisplayKind(rawKind: String) -> CustomerActivityDisplayKind {
    let k = rawKind.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)

    switch k {
    case "offer_sent", "offer_received", "offers", "offer_expiring_soon":
        return .openingReceived
    case "claim_submitted":
        return .claimSent
    case "claim_received", "claim_pending_confirmation":
        return .waitingForConfirmation
    case "booking_confirmed":
        return .confirmed
    case "slot_expired", "offer_expired", "claim_unavailable", "missed_opportunity":
        return .openingNoLongerAvailable
    case "standby_status_reminder", "standby_setup_suggestion":
        return .standbyUpdated
    case "notification_sent", "push_sent":
        return .notificationSent
    case "preferences_updated", "notification_preferences_updated":
        return .preferencesChanged
    case "business_joined", "customer_joined_business", "membership_activated", "joined_business",
         "standby_joined", "customer_joined":
        return .businessJoined
    default:
        return .unknown
    }
}

/// Second line under the title (compact context, no raw `kind` strings).
func customerActivityDetailLine(for item: CustomerActivityItem) -> String? {
    var parts: [String] = []
    if let business = item.businessName?.trimmingCharacters(in: .whitespacesAndNewlines), !business.isEmpty {
        parts.append(business)
    }
    if let service = item.serviceName?.trimmingCharacters(in: .whitespacesAndNewlines), !service.isEmpty {
        parts.append(service)
    }
    if let location = item.locationName?.trimmingCharacters(in: .whitespacesAndNewlines), !location.isEmpty {
        parts.append(location)
    }
    if let startsAt = item.startsAt {
        let range = DateFormatterPF.dateTimeRange(start: startsAt, end: item.endsAt)
        if !range.isEmpty { parts.append(range) }
    }
    let joined = parts.joined(separator: " · ")
    if !joined.isEmpty { return joined }

    if let detail = item.detail?.trimmingCharacters(in: .whitespacesAndNewlines), !detail.isEmpty {
        return detail
    }
    return nil
}

func customerActivityRowDot(for kind: CustomerActivityDisplayKind) -> CustomerActivityRowDot {
    switch kind {
    case .confirmed:
        return .success
    case .openingReceived, .claimSent, .waitingForConfirmation:
        return .ember
    default:
        return .muted
    }
}

// MARK: - Timeline grouping (Today / Yesterday / Earlier)

struct CustomerActivityTimelineRow: Identifiable {
    let id: String
    let title: String
    let detail: String?
    let relativeTime: String
    let dot: CustomerActivityRowDot
    let chipKind: PFCustomerOfferStatusKind
    let chipCaption: String
}

struct CustomerActivityTimelineGroup: Identifiable {
    let id: String
    let sectionTitle: String
    let rows: [CustomerActivityTimelineRow]
}

func customerActivityTimelineGroups(from items: [CustomerActivityItem]) -> [CustomerActivityTimelineGroup] {
    let cal = Calendar.current
    let now = Date()
    let startOfToday = cal.startOfDay(for: now)
    guard let startOfYesterday = cal.date(byAdding: .day, value: -1, to: startOfToday) else {
        return []
    }

    var today: [CustomerActivityItem] = []
    var yesterday: [CustomerActivityItem] = []
    var earlier: [CustomerActivityItem] = []

    for item in items {
        guard let d = CustomerStatusPresentersISO.parse(item.occurredAt) else {
            earlier.append(item)
            continue
        }
        if d >= startOfToday {
            today.append(item)
        } else if d >= startOfYesterday {
            yesterday.append(item)
        } else {
            earlier.append(item)
        }
    }

    var groups: [CustomerActivityTimelineGroup] = []
    if !today.isEmpty {
        groups.append(
            CustomerActivityTimelineGroup(id: "today", sectionTitle: "Today", rows: mapTimelineRows(today))
        )
    }
    if !yesterday.isEmpty {
        groups.append(
            CustomerActivityTimelineGroup(id: "yesterday", sectionTitle: "Yesterday", rows: mapTimelineRows(yesterday))
        )
    }
    if !earlier.isEmpty {
        groups.append(
            CustomerActivityTimelineGroup(id: "earlier", sectionTitle: "Earlier", rows: mapTimelineRows(earlier))
        )
    }
    return groups
}

private func mapTimelineRows(_ items: [CustomerActivityItem]) -> [CustomerActivityTimelineRow] {
    items.map { item in
        let kind = customerActivityDisplayKind(rawKind: item.kind)
        return CustomerActivityTimelineRow(
            id: item.id,
            title: kind.title,
            detail: customerActivityDetailLine(for: item),
            relativeTime: DateFormatterPF.relative(item.occurredAt),
            dot: customerActivityRowDot(for: kind),
            chipKind: kind.statusChipKind,
            chipCaption: kind.timelineChipCaption
        )
    }
}

extension CustomerActivityTimelineRow {
    @ViewBuilder
    func rowView(tap: @escaping () -> Void) -> some View {
        Button {
            PFHaptics.lightImpact()
            tap()
        } label: {
            CustomerActivityRow(
                title: title,
                relativeTime: relativeTime,
                detail: detail,
                dot: dot,
                statusChipKind: chipKind,
                statusChipCaption: chipCaption
            )
        }
        .buttonStyle(CustomerCardPressButtonStyle())
    }
}
