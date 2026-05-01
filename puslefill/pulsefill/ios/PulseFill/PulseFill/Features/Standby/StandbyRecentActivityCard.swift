import SwiftUI

struct StandbyRecentActivityCard: View {
    let activity: StandbyRecentActivity

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("RECENT ACTIVITY")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            Text("Last \(activity.windowDays) days")
                .font(.system(size: 13, weight: .regular))
                .foregroundStyle(PFColor.textSecondary)

            HStack(spacing: 16) {
                metric(title: "Openings", value: activity.recentOffers)
                metric(title: "Claims", value: activity.recentClaims)
                metric(title: "Missed", value: activity.recentMissed)
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
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
