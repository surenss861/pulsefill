import SwiftUI

struct OperatorDeliveryReliabilityCard: View {
    let data: OperatorDeliveryReliabilityResponse

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("DELIVERY RELIABILITY")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            Text("\(data.summary.deliveredToday) delivered · \(data.summary.failedToday) failed · \(data.summary.simulatedToday) simulated")
                .font(.system(size: 15))
                .foregroundStyle(PFColor.textPrimary)

            Text("\(data.summary.customersWithNoPushDevice) no push device · \(data.summary.customersWithNoReachableChannel) unreachable")
                .font(.system(size: 13))
                .foregroundStyle(PFColor.textSecondary)

            if let reason = data.highlights.topFailureReason, !reason.isEmpty {
                Text("Top issue: \(reason)")
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
