import SwiftUI

struct StandbyStatusSummaryCard: View {
    let summary: StandbyStatusSummary

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("COVERAGE")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            HStack(spacing: 16) {
                metric(title: "Active", value: summary.activePreferences)
                metric(title: "Paused", value: summary.pausedPreferences)
                metric(title: "Clinics", value: summary.businessesCovered)
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .strokeBorder(Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    private func metric(title: String, value: Int) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)
            Text("\(value)")
                .font(.system(size: 22, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
