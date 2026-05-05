import SwiftUI

struct StandbyRecentActivityCard: View {
    let activity: StandbyRecentActivity

    var body: some View {
        PFCustomerSectionCard(variant: .default, padding: 18) {
            VStack(alignment: .leading, spacing: 12) {
                PFTypography.Customer.label("Recent activity")

                Text("Last \(activity.windowDays) days")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)

                HStack(spacing: 16) {
                    metric(title: "Openings", value: activity.recentOffers)
                    metric(title: "Claims", value: activity.recentClaims)
                    metric(title: "Passed openings", value: activity.recentMissed)
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
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
