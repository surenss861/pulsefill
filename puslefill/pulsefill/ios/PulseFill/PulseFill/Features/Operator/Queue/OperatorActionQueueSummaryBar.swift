import SwiftUI

struct OperatorActionQueueSummaryBar: View {
    let summary: OperatorActionQueueSummary

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                PFMetricCard(value: "\(summary.needsActionCount)", label: "Needs action", tone: PFColor.warning)
                PFMetricCard(value: "\(summary.reviewCount)", label: "Review", tone: PFColor.primary)
                PFMetricCard(value: "\(summary.resolvedCount)", label: "Resolved", tone: PFColor.success)
            }
            .padding(.horizontal, 4)
        }
    }
}
