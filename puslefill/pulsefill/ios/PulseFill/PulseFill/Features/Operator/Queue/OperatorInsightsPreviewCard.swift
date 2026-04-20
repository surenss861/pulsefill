import SwiftUI

struct OperatorInsightsPreviewCard: View {
    let breakdown: OperatorOpsBreakdownResponse

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("INSIGHTS")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            insightRow("Top provider", breakdown.highlights.topProviderByRecoveredBookings)
            insightRow("Most no-match", breakdown.highlights.topServiceByNoMatches)
            insightRow("Most failures", breakdown.highlights.topLocationByFailures)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }

    private func insightRow(_ label: String, _ value: String?) -> some View {
        HStack(alignment: .top) {
            Text(label)
                .font(.system(size: 13))
                .foregroundStyle(PFColor.textSecondary)
                .frame(width: 96, alignment: .leading)

            Text((value?.isEmpty == false) ? (value ?? "") : "—")
                .font(.system(size: 15))
                .foregroundStyle(PFColor.textPrimary)

            Spacer(minLength: 0)
        }
    }
}
