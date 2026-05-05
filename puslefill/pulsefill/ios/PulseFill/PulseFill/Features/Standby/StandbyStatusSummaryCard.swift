import SwiftUI

struct StandbyStatusSummaryCard: View {
    let summary: StandbyStatusSummary

    var body: some View {
        PFCustomerSectionCard(variant: .elevated, padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                PFTypography.Customer.label("Your standby")

                HStack(spacing: 16) {
                    metric(title: "Active", value: summary.activePreferences)
                    metric(title: "Paused", value: summary.pausedPreferences)
                    metric(title: "Businesses", value: summary.businessesCovered)
                }
            }
        }
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
