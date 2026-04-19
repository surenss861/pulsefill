import SwiftUI

struct OperatorActionQueueSummaryBar: View {
    let summary: OperatorActionQueueSummary

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                chip("Needs action", value: summary.needsActionCount, tone: PFColor.warning)
                chip("Review", value: summary.reviewCount, tone: PFColor.primary)
                chip("Resolved", value: summary.resolvedCount, tone: PFColor.success)
            }
            .padding(.horizontal, 4)
        }
    }

    private func chip(_ label: String, value: Int, tone: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("\(value)")
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)
            Text(label)
                .font(.system(size: 12, weight: .regular))
                .foregroundStyle(PFColor.textSecondary)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(tone.opacity(0.12))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(tone.opacity(0.22), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}
