import SwiftUI

/// Task-first claim row for Business **Claims** — opening + claim context separate from slot-only lists.
struct OperatorClaimCard: View {
    let item: OperatorClaimListItem
    let customerLineDisplay: String
    let isConfirming: Bool
    /// When false, only “Open detail” is shown (recently confirmed / closed).
    let showConfirmPrimary: Bool
    /// Fired after the operator accepts the confirmation sheet (not a tap-to-confirm).
    let onRequestConfirm: () -> Void
    let onOpenDetail: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(item.primaryTitle)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)
                    .fixedSize(horizontal: false, vertical: true)

                Text(DateFormatterPF.dateTimeRange(start: item.startsAt, end: item.endsAt))
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)

                if let prov = item.providerLine {
                    Text(prov)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)
                }

                Text(customerLineDisplay)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(PFColor.textPrimary)

                if let claimed = item.claimedRelativeLine {
                    Text(claimed)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)
                }
            }
            .contentShape(Rectangle())
            .onTapGesture(perform: onOpenDetail)

            HStack(spacing: 8) {
                StatusChipView(operatorOpeningStatus: item.slotStatus)
                StatusChipView(operatorClaimStatus: item.claim.status)
            }

            HStack(spacing: 10) {
                if showConfirmPrimary {
                    Button {
                        onRequestConfirm()
                    } label: {
                        Text(isConfirming ? "Confirming…" : "Confirm booking")
                            .font(.system(size: 15, weight: .bold))
                            .frame(maxWidth: .infinity, minHeight: 44)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(PFColor.primaryDark)
                    .disabled(isConfirming)

                    Button("Open detail") {
                        onOpenDetail()
                    }
                    .font(.system(size: 15, weight: .semibold))
                    .buttonStyle(.bordered)
                } else {
                    Button("Open detail") {
                        onOpenDetail()
                    }
                    .font(.system(size: 15, weight: .semibold))
                    .buttonStyle(.bordered)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                Spacer(minLength: 0)
            }
        }
        .padding(16)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .stroke(
                    showConfirmPrimary ? PFColor.warning.opacity(0.28) : PFColor.textSecondary.opacity(0.14),
                    lineWidth: 1
                )
        )
    }
}
