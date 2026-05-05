import SwiftUI

struct StandbyStatusPreferenceCard: View {
    let row: StandbyStatusPreferenceRow

    var body: some View {
        PFCustomerSectionCard(variant: .default, padding: 18) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(row.businessName ?? "Business")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(PFColor.textPrimary)
                    Spacer()
                    StatusChipView(text: row.active ? "Active" : "Paused", tone: row.active ? .success : .neutral)
                }

                if let serviceName = row.serviceName {
                    Text(serviceName)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)
                }

                if !detailLine.isEmpty {
                    Text(detailLine)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
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
            details.append("Notice window: \(h) hours or more")
        }
        return details.joined(separator: " · ")
    }
}
