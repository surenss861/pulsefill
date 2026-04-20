import SwiftUI

struct MissedOpportunitiesSummaryCard: View {
    let summary: MissedOpportunitiesSummary

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("RECENT OPPORTUNITIES")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            Text("\(summary.missedLast7Days) missed in the last 7 days")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)

            if let topReason = summary.topReason, !topReason.isEmpty {
                Text("Most common reason: \(topReason.replacingOccurrences(of: "_", with: " "))")
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }

            if summary.notificationsLikelyHelped {
                Text("Improving notification readiness may help you catch future openings faster.")
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }
}

struct MissedOpportunityGuidanceChip: View {
    let title: String

    var body: some View {
        Text(title)
            .font(.system(size: 13))
            .foregroundStyle(PFColor.textPrimary)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(PFColor.primary.opacity(0.10))
            .clipShape(Capsule())
    }
}

struct MissedOpportunityCard: View {
    let item: MissedOpportunityItem

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(item.reasonTitle.uppercased())
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.warning)

            Text(item.businessName ?? "Clinic")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)

            if let serviceName = item.serviceName {
                Text(serviceName)
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }

            if let startsAt = item.startsAt {
                Text(DateFormatterPF.dateTimeRange(start: startsAt, end: item.endsAt))
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }

            if let reasonDetail = item.reasonDetail, !reasonDetail.isEmpty {
                Text(reasonDetail)
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }

            if !item.guidance.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(item.guidance, id: \.code) { guidance in
                            MissedOpportunityGuidanceChip(title: guidance.title)
                        }
                    }
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }
}
