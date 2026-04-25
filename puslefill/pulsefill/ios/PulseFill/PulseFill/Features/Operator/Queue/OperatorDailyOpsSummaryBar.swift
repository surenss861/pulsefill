import SwiftUI

struct OperatorDailyOpsSummaryBar: View {
    let summary: OperatorDailyOpsSummaryResponse

    var body: some View {
        PFSectionCard(
            eyebrow: "Today",
            title: "Recovery pulse",
            description: "Live signal from confirmed recoveries and queue pressure."
        ) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    PFMetricCard(value: "\(summary.metrics.recoveredBookingsToday)", label: "Recovered", tone: PFColor.primary)
                    PFMetricCard(value: CurrencyFormatter.currency(cents: summary.metrics.recoveredRevenueCentsToday), label: "Revenue", tone: PFColor.primary)
                    PFMetricCard(value: "\(summary.metrics.awaitingConfirmationCount)", label: "Awaiting", tone: PFColor.warning)
                    PFMetricCard(value: "\(summary.metrics.deliveryFailuresToday)", label: "Failures", tone: PFColor.error)
                    PFMetricCard(value: "\(summary.metrics.noMatchesToday)", label: "No matches", tone: PFColor.textSecondary)
                    PFMetricCard(value: "\(summary.metrics.activeOfferedSlotsCount)", label: "Active offered", tone: PFColor.primary)
                }
            }
        }
    }
}
