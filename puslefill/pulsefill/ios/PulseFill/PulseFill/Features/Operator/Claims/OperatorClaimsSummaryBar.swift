import SwiftUI

struct OperatorClaimsSummaryBar: View {
    let awaitingCount: Int
    let confirmedCount: Int
    let totalCount: Int

    var body: some View {
        HStack(spacing: 10) {
            summaryChip("\(awaitingCount)", "Need confirmation", PFColor.warning)
            summaryChip("\(confirmedCount)", "Confirmed", PFColor.success)
            summaryChip("\(totalCount)", "Total", PFColor.primary)
        }
    }

    private func summaryChip(_ value: String, _ label: String, _ tone: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)
            Text(label)
                .font(.system(size: 12))
                .foregroundStyle(PFColor.textSecondary)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(tone.opacity(0.10))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(tone.opacity(0.22), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}
