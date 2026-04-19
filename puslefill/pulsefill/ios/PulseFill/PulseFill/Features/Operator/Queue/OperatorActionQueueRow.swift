import SwiftUI

struct OperatorActionQueueRow: View {
    let item: OperatorActionQueueItem
    let onPrimaryAction: (OperatorActionQueueItem) -> Void
    let onOpen: (OperatorActionQueueItem) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 10) {
                Circle()
                    .fill(OperatorQueuePresenters.severityColor(item.severity))
                    .frame(width: 10, height: 10)
                    .padding(.top, 5)

                VStack(alignment: .leading, spacing: 6) {
                    Text(OperatorQueuePresenters.kindTitle(item.kind).uppercased())
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(PFColor.textSecondary)

                    Text(item.headline)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(PFColor.textPrimary)

                    if let detail = item.detail, !detail.isEmpty {
                        Text(detail)
                            .font(.system(size: 13))
                            .foregroundStyle(PFColor.textSecondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    metadata
                }

                Spacer(minLength: 0)
            }

            HStack(spacing: 10) {
                if let primary = item.actions.first {
                    Button(OperatorQueuePresenters.primaryActionTitle(primary)) {
                        onPrimaryAction(item)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(PFColor.primaryDark)
                }

                Button("Open") {
                    onOpen(item)
                }
                .buttonStyle(.bordered)
            }
        }
        .padding(16)
        .background(PFSurface.card)
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .stroke(OperatorQueuePresenters.severityColor(item.severity).opacity(0.2), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }

    @ViewBuilder
    private var metadata: some View {
        VStack(alignment: .leading, spacing: 4) {
            let line = [item.serviceName, item.providerName].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · ")
            if !line.isEmpty {
                Text(line)
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }
            if let loc = item.locationName, !loc.isEmpty {
                Text(loc)
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }
            Text(DateFormatterPF.dateTimeRange(start: item.startsAt, end: item.endsAt))
                .font(.system(size: 13))
                .foregroundStyle(PFColor.textSecondary)
            if let customerLabel = item.customerLabel, !customerLabel.isEmpty {
                Text("Customer: \(customerLabel)")
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textPrimary)
            }
        }
    }
}
