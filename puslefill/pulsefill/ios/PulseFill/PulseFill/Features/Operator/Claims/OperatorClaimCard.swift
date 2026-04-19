import SwiftUI

struct OperatorClaimCard: View {
    let claim: OperatorClaimCardModel
    let isConfirming: Bool
    let onConfirm: () -> Void
    let onOpen: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(OperatorClaimsPresenters.bannerTitle(for: claim))
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(OperatorClaimsPresenters.isAwaiting(claim) ? PFColor.warning : PFColor.success)

            Text("RECOVERY SLOT")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            if let providerName = claim.providerName, !providerName.isEmpty {
                Text(providerName)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)
            }

            if let sid = claim.serviceId {
                Text(shortId(sid))
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }

            Text(DateFormatterPF.dateTimeRange(start: claim.startsAt, end: claim.endsAt))
                .font(.system(size: 13))
                .foregroundStyle(PFColor.textSecondary)

            VStack(alignment: .leading, spacing: 4) {
                Text("WINNING CUSTOMER")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(PFColor.textSecondary)
                Text(claim.customerLabel())
                    .font(.system(size: 17))
                    .foregroundStyle(PFColor.textPrimary)
            }

            HStack(spacing: 10) {
                StatusChipView(status: claim.claimStatus)

                if OperatorClaimsPresenters.isAwaiting(claim) {
                    Button(isConfirming ? "Confirming…" : "Confirm") {
                        onConfirm()
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(PFColor.primaryDark)
                    .disabled(isConfirming)
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
                .stroke(
                    (OperatorClaimsPresenters.isAwaiting(claim) ? PFColor.warning : PFColor.success).opacity(0.2),
                    lineWidth: 1
                )
        )
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }

    private func shortId(_ id: String) -> String {
        if id.count <= 14 { return id }
        return "\(id.prefix(4))…\(id.suffix(4))"
    }
}
