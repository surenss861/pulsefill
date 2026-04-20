import SwiftUI

struct StandbyStatusPreferenceCard: View {
    let row: StandbyStatusPreferenceRow

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(row.businessName ?? "Clinic")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)
                Spacer()
                StatusChipView(text: row.active ? "Active" : "Paused", tone: row.active ? .success : .neutral)
            }

            if let serviceName = row.serviceName {
                Text(serviceName)
                    .font(.system(size: 14, weight: .regular))
                    .foregroundStyle(PFColor.textSecondary)
            }

            if !detailLine.isEmpty {
                Text(detailLine)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundStyle(PFColor.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
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

    private var detailLine: String {
        var details: [String] = []
        if let providerName = row.providerName, !providerName.isEmpty {
            details.append("Provider: \(providerName)")
        }
        if let locationName = row.locationName, !locationName.isEmpty {
            details.append("Location: \(locationName)")
        }
        if let h = row.maxNoticeHours {
            details.append("Notice: \(h)h or more")
        }
        return details.joined(separator: " · ")
    }
}
