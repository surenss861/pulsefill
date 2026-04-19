import SwiftUI

struct OperatorActionQueueSectionView: View {
    let title: String
    let items: [OperatorActionQueueItem]
    let onPrimaryAction: (OperatorActionQueueItem) -> Void
    let onOpen: (OperatorActionQueueItem) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(title)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)
                Spacer()
                Text("\(items.count)")
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }

            if items.isEmpty {
                Text(emptyCopy)
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
                    .padding(.top, 2)
            } else {
                VStack(spacing: 12) {
                    ForEach(items) { item in
                        OperatorActionQueueRow(
                            item: item,
                            onPrimaryAction: onPrimaryAction,
                            onOpen: onOpen
                        )
                    }
                }
            }
        }
    }

    private var emptyCopy: String {
        switch title {
        case "Needs action now":
            "Nothing urgent right now."
        case "Watch / review":
            "Nothing to review right now."
        default:
            "No recent resolved items yet."
        }
    }
}
