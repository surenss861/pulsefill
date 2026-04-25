import SwiftUI

struct OperatorActionQueueRow: View {
    let item: OperatorActionQueueItem
    let isBusy: Bool
    let successPulseTrigger: String
    let onPrimaryAction: (OperatorActionQueueItem) -> Void
    let onOpen: (OperatorActionQueueItem) -> Void

    var body: some View {
        PFSectionCard(borderColor: OperatorQueuePresenters.severityColor(item.severity).opacity(0.22)) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .center, spacing: 8) {
                    PFStatusPill(
                        text: OperatorQueuePresenters.kindTitle(item.kind),
                        variant: OperatorQueuePresenters.severityPillVariant(item.severity),
                        uppercase: false
                    )
                    Spacer()
                    let freshness = DateFormatterPF.relative(item.createdAt)
                    if !freshness.isEmpty {
                        Text(freshness)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(PFColor.textSecondary)
                    }
                }

                Text(titleText)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)
                    .lineLimit(2)

                Text(contextLine)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineLimit(2)

                Text(guidanceLine)
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)

                HStack(spacing: 10) {
                    if let primary = item.actions.first {
                        Button(isBusy ? "Working…" : primaryButtonTitle(primary: primary)) {
                            onPrimaryAction(item)
                        }
                        .buttonStyle(PFPrimaryButtonStyle())
                        .disabled(isBusy)
                    }

                    Spacer(minLength: 0)

                    Button("Open detail") {
                        onOpen(item)
                    }
                    .buttonStyle(.plain)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(PFColor.textSecondary)
                }
            }
            .contentShape(Rectangle())
            .onTapGesture {
                onOpen(item)
            }
        }
        .pfPressableCard()
        .pfSuccessPulse(trigger: successPulseTrigger)
    }

    private var titleText: String {
        let service = item.serviceName?.trimmingCharacters(in: .whitespacesAndNewlines)
        if let service, !service.isEmpty {
            return service
        }
        return item.headline
    }

    private var contextLine: String {
        var parts: [String] = []
        if let provider = item.providerName?.trimmingCharacters(in: .whitespacesAndNewlines), !provider.isEmpty {
            parts.append(provider)
        }
        if let location = item.locationName?.trimmingCharacters(in: .whitespacesAndNewlines), !location.isEmpty {
            parts.append(location)
        }
        parts.append(DateFormatterPF.dateTimeRange(start: item.startsAt, end: item.endsAt))
        return parts.joined(separator: " · ")
    }

    private var guidanceLine: String {
        if let detail = item.detail?.trimmingCharacters(in: .whitespacesAndNewlines), !detail.isEmpty {
            return detail
        }
        switch item.kind {
        case .awaitingConfirmation:
            return "Confirm the claim to close the recovery loop."
        case .deliveryFailed:
            return "Outreach failed. Review and retry when appropriate."
        case .retryRecommended:
            return "Previous outreach did not convert. Retry now."
        case .noMatches:
            return "No matching standby demand found for this opening."
        case .offeredActive:
            return "Offers are active. Monitor for claim progression."
        case .expiredUnfilled:
            return "This opening expired without a confirmed recovery."
        case .confirmedBooking:
            return "Recovered and confirmed. Open detail for full record."
        }
    }

    private func primaryButtonTitle(primary: OperatorQueueAction) -> String {
        if let inline = OperatorPrimaryActionDeriver.queueInline(from: item) {
            return inline.label
        }
        return OperatorQueuePresenters.primaryActionTitle(primary)
    }
}
