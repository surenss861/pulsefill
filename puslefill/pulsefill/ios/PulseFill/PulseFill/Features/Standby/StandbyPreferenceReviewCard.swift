import SwiftUI

private let reviewDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

struct StandbyPreferenceReviewCard: View {
    let draft: StandbyPreferenceDraft
    var resolved: StandbyResolvedLabels

    var body: some View {
        PFCustomerSectionCard(variant: .quiet, padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                Text("Review before saving")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)

                Text("Make sure this looks right. PulseFill uses these settings to decide which openings to send you.")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)

                VStack(spacing: 10) {
                    ReviewRow(
                        label: "Business",
                        value: draft.isBusinessIdValid
                            ? StandbyDisplayName.business(businessId: draft.trimmedBusinessId, resolvedName: resolved.businessName)
                            : StandbySetupCustomerCopy.businessMissingTitle
                    )
                    ReviewRow(
                        label: "Services",
                        value: StandbyDisplayName.service(serviceId: draft.serviceId, resolvedName: resolved.serviceName)
                    )
                    ReviewRow(label: "Days", value: daysLine(draft.daysOfWeek))
                    ReviewRow(
                        label: "Hours",
                        value: "\(timeString(draft.earliestTime)) – \(timeString(draft.latestTime))"
                    )
                    ReviewRow(
                        label: "Notice",
                        value: StandbySetupCustomerCopy.noticeSummaryLabel(hours: draft.maxNoticeHours)
                    )
                    ReviewRow(label: "Distance", value: "Up to \(draft.maxDistanceKm) km")
                    ReviewRow(label: "Deposit", value: draft.depositOk ? "OK with a deposit" : "Prefer no deposit")
                    ReviewRow(
                        label: "Alerts",
                        value: draft.wantsPushReminders ? "PulseFill alerts on" : "I’ll check the app myself"
                    )
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(PFColor.customerCard.opacity(0.5))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
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
