import SwiftUI

struct OperatorDailyOpsSummaryBar: View {
    let summary: OperatorDailyOpsSummaryResponse

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("TODAY'S RECOVERY")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    OperatorDailyOpsMetricChip(
                        value: "\(summary.metrics.recoveredBookingsToday)",
                        label: "Recovered"
                    )
                    OperatorDailyOpsMetricChip(
                        value: CurrencyFormatter.currency(cents: summary.metrics.recoveredRevenueCentsToday),
                        label: "Revenue"
                    )
                    OperatorDailyOpsMetricChip(
                        value: "\(summary.metrics.awaitingConfirmationCount)",
                        label: "Awaiting"
                    )
                    OperatorDailyOpsMetricChip(
                        value: "\(summary.metrics.deliveryFailuresToday)",
                        label: "Failures"
                    )
                    OperatorDailyOpsMetricChip(
                        value: "\(summary.metrics.noMatchesToday)",
                        label: "No matches"
                    )
                    OperatorDailyOpsMetricChip(
                        value: "\(summary.metrics.activeOfferedSlotsCount)",
                        label: "Active offered"
                    )
                }
            }
        }
    }
}
