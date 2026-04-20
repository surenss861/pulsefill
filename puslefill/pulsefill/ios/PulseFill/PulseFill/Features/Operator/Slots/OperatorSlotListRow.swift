import SwiftUI

struct OperatorSlotListRow: View {
    let slot: StaffOpenSlotListRow
    let primaryAction: OperatorPrimaryAction?
    let isPerforming: Bool
    let onPrimaryAction: () -> Void
    let onOpen: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(slot.providerNameSnapshot ?? "Unknown provider")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(PFColor.textPrimary)

                    Text(DateFormatterPF.dateTimeRange(start: slot.startsAt, end: slot.endsAt))
                        .font(.system(size: 13))
                        .foregroundStyle(PFColor.textSecondary)
                }

                Spacer(minLength: 0)

                StatusChipView(status: slot.status)
            }

            HStack(spacing: 10) {
                if let primaryAction {
                    Button(isPerforming ? "Working…" : primaryAction.label) {
                        onPrimaryAction()
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(PFColor.primaryDark)
                    .disabled(isPerforming)
                }

                Button("Open") {
                    onOpen()
                }
                .buttonStyle(.bordered)
            }
        }
        .padding(16)
        .background(PFSurface.card)
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .stroke(PFColor.textSecondary.opacity(0.15), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }
}
