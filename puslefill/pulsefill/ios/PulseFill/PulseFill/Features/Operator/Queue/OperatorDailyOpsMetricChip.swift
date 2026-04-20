import SwiftUI

struct OperatorDailyOpsMetricChip: View {
    let value: String
    let label: String

    var body: some View {
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
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}
