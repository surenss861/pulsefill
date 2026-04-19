import SwiftUI

private let cardDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

struct SavedStandbyPreferenceCard: View {
    let preference: StandbyPreference
    var resolved: StandbyResolvedLabels?
    var onEdit: () -> Void
    var onToggleActive: () -> Void
    var onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Standby preference")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)
                Spacer()
                StatusChipView(text: preference.active ? "Active" : "Paused", tone: preference.active ? .success : .neutral)
            }

            Text(summary)
                .font(.system(size: 15, weight: .regular))
                .foregroundStyle(PFColor.textSecondary)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: 10) {
                Button("Edit") {
                    onEdit()
                }
                .buttonStyle(.bordered)

                Button(preference.active ? "Pause" : "Resume") {
                    onToggleActive()
                }
                .buttonStyle(.bordered)

                Button("Delete", role: .destructive) {
                    onDelete()
                }
                .buttonStyle(.bordered)
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

    private var summary: String {
        let biz = StandbyDisplayName.business(businessId: preference.businessId, resolvedName: resolved?.businessName)
        let sid = preference.serviceId?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let svcLine: String
        if sid.isEmpty {
            svcLine = "Any service"
        } else {
            svcLine = StandbyDisplayName.service(serviceId: preference.serviceId, resolvedName: resolved?.serviceName)
        }
        var parts: [String] = ["\(biz) · \(svcLine)"]
        if !preference.daysOfWeek.isEmpty {
            let days = preference.daysOfWeek.sorted().map { cardDayLabels[$0] }.joined(separator: ", ")
            parts.append("Days: \(days)")
        }
        if let h = preference.maxNoticeHours {
            parts.append("Notice: \(h)h+")
        }
        if let e = preference.earliestTime, let l = preference.latestTime {
            parts.append("Usually \(e) – \(l)")
        }
        return parts.joined(separator: " · ")
    }
}
