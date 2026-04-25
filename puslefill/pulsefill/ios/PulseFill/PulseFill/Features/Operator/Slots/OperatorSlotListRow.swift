import SwiftUI

struct OperatorSlotListRow: View {
    let slot: StaffOpenSlotListRow
    let primaryAction: OperatorPrimaryAction?
    let isPerforming: Bool
    let successPulseTrigger: String
    let onPrimaryAction: () -> Void
    let onOpen: () -> Void

    var body: some View {
        PFSectionCard(borderColor: PFColor.textSecondary.opacity(0.18)) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .center, spacing: 8) {
                    StatusChipView(status: slot.status)
                    if let attention = attentionText {
                        PFStatusPill(text: attention, variant: .warning)
                    }
                    Spacer(minLength: 0)
                }

                Text(titleText)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)
                    .lineLimit(2)

                Text(contextLine)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineLimit(2)

                if let guidance = attentionGuidance {
                    Text(guidance)
                        .font(.system(size: 13))
                        .foregroundStyle(PFColor.textSecondary)
                        .lineLimit(2)
                }

                HStack(spacing: 10) {
                    if let primaryAction {
                        Button(isPerforming ? "Working…" : primaryAction.label) {
                            onPrimaryAction()
                        }
                        .buttonStyle(PFPrimaryButtonStyle())
                        .disabled(isPerforming)
                    }

                    Spacer(minLength: 0)

                    Button("Open detail") {
                        onOpen()
                    }
                    .buttonStyle(.plain)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(PFColor.textSecondary)
                }
            }
            .contentShape(Rectangle())
            .onTapGesture {
                onOpen()
            }
        }
        .pfPressableCard()
        .pfSuccessPulse(trigger: successPulseTrigger)
    }

    private var titleText: String {
        let trimmed = slot.providerNameSnapshot?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? "Open slot" : trimmed
    }

    private var contextLine: String {
        DateFormatterPF.dateTimeRange(start: slot.startsAt, end: slot.endsAt)
    }

    private var attentionText: String? {
        switch slot.status.lowercased() {
        case "claimed":
            return "Awaiting confirmation"
        case "offered":
            return "Offers active"
        case "expired":
            return "Unfilled"
        default:
            return nil
        }
    }

    private var attentionGuidance: String? {
        switch slot.status.lowercased() {
        case "claimed":
            return "A winner exists. Confirm booking from detail to finalize recovery."
        case "offered":
            return "Offers are still live. Retry or inspect delivery from detail if needed."
        case "expired":
            return "Recovery window has closed for this opening."
        default:
            return nil
        }
    }
}
