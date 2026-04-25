import SwiftUI

struct CustomerActivityCard: View {
    let item: CustomerActivityItem

    private var kind: CustomerEventKind? {
        CustomerEventKind(rawKind: item.kind)
    }

    var body: some View {
        PFSectionCard(borderColor: Color.white.opacity(0.10)) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .center, spacing: 8) {
                    if let kind {
                        PFStatusPill(
                            text: CustomerStateLabelPresenter.label(for: kind),
                            variant: pillVariant(for: kind),
                            uppercase: false
                        )
                    }
                    Spacer()
                    Text(DateFormatterPF.relative(item.occurredAt))
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)
                }

                Text(displayTitle)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)
                    .lineLimit(2)

                Text(contextLine)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineLimit(2)

                if let consequence = consequenceLine {
                    Text(consequence)
                        .font(.system(size: 13))
                        .foregroundStyle(PFColor.textSecondary)
                        .lineLimit(2)
                }
            }
        }
        .pfPressableCard()
    }

    private var displayTitle: String {
        if let kind, item.title.isEmpty {
            return CustomerEventCopy.fallbackTitle(for: kind)
        }
        return item.title
    }

    private var contextLine: String {
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
            parts.append(DateFormatterPF.dateTimeRange(start: startsAt, end: item.endsAt))
        } else {
            parts.append(DateFormatterPF.medium(item.occurredAt))
        }
        return parts.joined(separator: " · ")
    }

    private var consequenceLine: String? {
        if let detail = item.detail?.trimmingCharacters(in: .whitespacesAndNewlines), !detail.isEmpty {
            return detail
        }
        return nil
    }

    private func pillVariant(for kind: CustomerEventKind) -> PFStatusPill.Variant {
        switch kind {
        case .bookingConfirmed, .claimSubmitted:
            return .success
        case .offerExpiringSoon, .claimPendingConfirmation:
            return .warning
        case .offerExpired, .claimUnavailable, .missedOpportunity:
            return .danger
        default:
            return .primary
        }
    }
}
