import Foundation
import SwiftUI

enum CustomerActivityDisplayKind: Equatable {
    case offerAvailable
    case claimSubmitted
    case bookingConfirmed
    case openingExpired
    case standbyUpdated
    case notificationSent
    case preferencesChanged
    case unknown

    var title: String {
        switch self {
        case .offerAvailable: return "Offer available"
        case .claimSubmitted: return "Claim submitted"
        case .bookingConfirmed: return "Booking confirmed"
        case .openingExpired: return "Opening expired"
        case .standbyUpdated: return "Standby updated"
        case .notificationSent: return "Notification sent"
        case .preferencesChanged: return "Preferences changed"
        case .unknown: return "Activity update"
        }
    }
}

func customerActivityDisplayKind(rawKind: String) -> CustomerActivityDisplayKind {
    let k = rawKind.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)

    switch k {
    case "offer_sent", "offer_received", "offers", "offer_expiring_soon":
        return .offerAvailable
    case "claim_received", "claim_submitted", "claim_pending_confirmation":
        return .claimSubmitted
    case "booking_confirmed":
        return .bookingConfirmed
    case "slot_expired", "offer_expired", "claim_unavailable", "missed_opportunity":
        return .openingExpired
    case "standby_status_reminder", "standby_setup_suggestion":
        return .standbyUpdated
    case "notification_sent", "push_sent":
        return .notificationSent
    case "preferences_updated", "notification_preferences_updated":
        return .preferencesChanged
    default:
        return .unknown
    }
}

/// Second line under the title (compact context, no raw `kind` strings).
func customerActivityDetailLine(for item: CustomerActivityItem) -> String? {
    var parts: [String] = []
    if let service = item.serviceName?.trimmingCharacters(in: .whitespacesAndNewlines), !service.isEmpty {
        parts.append(service)
    }
    if let provider = item.providerName?.trimmingCharacters(in: .whitespacesAndNewlines), !provider.isEmpty {
        parts.append(provider)
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
    case .bookingConfirmed:
        return .success
    case .offerAvailable, .claimSubmitted:
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
            dot: customerActivityRowDot(for: kind)
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
            CustomerActivityRow(title: title, relativeTime: relativeTime, detail: detail, dot: dot)
        }
        .buttonStyle(CustomerCardPressButtonStyle())
    }
}
