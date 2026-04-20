import SwiftUI

struct OperatorSlotDeliverySummaryCard: View {
    let logs: [OperatorNotificationLogRow]

    var body: some View {
        let delivered = logs.filter { $0.status == "delivered" }.count
        let failed = logs.filter { $0.status == "failed" }.count
        let simulated = logs.filter { $0.status == "simulated" }.count
        let latestFailure = logs.first(where: { $0.status == "failed" })

        VStack(alignment: .leading, spacing: 12) {
            Text("DELIVERY SUMMARY")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            Text("\(delivered) delivered · \(failed) failed · \(simulated) simulated")
                .font(.system(size: 15))
                .foregroundStyle(PFColor.textPrimary)

            if let reason = latestFailure?.error, !reason.isEmpty {
                Text("Latest issue: \(reason)")
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
