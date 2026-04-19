import SwiftUI

private let reviewDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

struct StandbyPreferenceReviewCard: View {
    let draft: StandbyPreferenceDraft
    var resolved: StandbyResolvedLabels

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            PFTypography.section("Review before saving")
            PFTypography.caption("Make sure this looks right. PulseFill uses these settings to decide which earlier openings to offer you.")

            VStack(spacing: 10) {
                ReviewRow(
                    label: "Business",
                    value: draft.isBusinessIdValid
                        ? StandbyDisplayName.business(businessId: draft.trimmedBusinessId, resolvedName: resolved.businessName)
                        : "Add valid clinic ID"
                )
                ReviewRow(
                    label: "Service",
                    value: StandbyDisplayName.service(serviceId: draft.serviceId, resolvedName: resolved.serviceName)
                )
                ReviewRow(label: "Days", value: daysLine(draft.daysOfWeek))
                ReviewRow(label: "Hours", value: "\(timeString(draft.earliestTime)) – \(timeString(draft.latestTime))")
                ReviewRow(label: "Notice", value: "\(draft.maxNoticeHours) hour(s) min")
                ReviewRow(label: "Distance", value: "≤ \(draft.maxDistanceKm) km")
                ReviewRow(label: "Deposit OK", value: draft.depositOk ? "Yes" : "No")
                ReviewRow(label: "Alerts", value: draft.wantsPushReminders ? "You’ll watch for alerts" : "Self-managed")
            }
            .padding(PFSpacing.md)
            .background(PFSurface.card)
            .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
        }
    }

    private func daysLine(_ set: Set<Int>) -> String {
        if set.isEmpty { return "Pick at least one day" }
        return set.sorted().map { reviewDayLabels[$0] }.joined(separator: ", ")
    }

    private func timeString(_ date: Date) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone.current
        f.dateFormat = "h:mm a"
        return f.string(from: date)
    }
}

private struct ReviewRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack(alignment: .top) {
            Text(label)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(PFColor.textSecondary)
                .frame(width: 96, alignment: .leading)
            Text(value)
                .font(.system(size: 15, weight: .regular))
                .foregroundStyle(PFColor.textPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
