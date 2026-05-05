import SwiftUI

struct OperatorSlotDeliverySummaryCard: View {
    let logs: [OperatorNotificationLogRow]

    var body: some View {
        let sent = logs.filter { log in
            guard log.status == "delivered" else { return false }
            let mode = log.metadata?.deliveryMode?.lowercased()
            if mode == "simulated" { return false }
            if mode == "skipped" { return false }
            if log.metadata?.skipReason == "customer_push_disabled" { return false }
            return true
        }.count
        let skipped = logs.filter { log in
            guard log.status == "delivered" else { return false }
            let mode = log.metadata?.deliveryMode?.lowercased()
            return mode == "skipped" || log.metadata?.skipReason == "customer_push_disabled"
        }.count
        let failed = logs.filter { $0.status == "failed" }.count
        let simulated = logs.filter { log in
            log.status == "delivered" && log.metadata?.deliveryMode?.lowercased() == "simulated"
        }.count
        let latestFailure = logs.first(where: { $0.status == "failed" })

        VStack(alignment: .leading, spacing: 12) {
            Text("DELIVERY SUMMARY")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            Text("\(sent) sent · \(skipped) skipped · \(failed) failed · \(simulated) simulated")
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
