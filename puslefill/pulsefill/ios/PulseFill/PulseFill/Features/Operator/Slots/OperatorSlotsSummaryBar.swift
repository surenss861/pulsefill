import SwiftUI

struct OperatorSlotsSummaryBar: View {
    let counts: [String: Int]

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                PFMetricCard(value: "\(counts["open"] ?? 0)", label: "Open", tone: PFColor.primary)
                PFMetricCard(value: "\(counts["offered"] ?? 0)", label: "Offered", tone: PFColor.primary)
                PFMetricCard(value: "\(counts["claimed"] ?? 0)", label: "Claimed", tone: PFColor.warning)
                PFMetricCard(value: "\(counts["booked"] ?? 0)", label: "Booked", tone: PFColor.success)
                PFMetricCard(value: "\(counts["expired"] ?? 0)", label: "Expired", tone: PFColor.textSecondary)
            }
            .padding(.horizontal, 4)
        }
    }
}
