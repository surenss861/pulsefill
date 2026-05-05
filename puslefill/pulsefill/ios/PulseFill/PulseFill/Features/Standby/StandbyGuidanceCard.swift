import SwiftUI

struct StandbyGuidanceCard: View {
    let item: StandbyGuidanceItem

    var body: some View {
        PFCustomerSectionCard(variant: .quiet, padding: 16) {
            HStack(alignment: .top, spacing: 12) {
                StatusChipView(text: toneLabel, tone: chipTone)
                Text(item.title)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(PFColor.textPrimary)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 0)
            }
        }
    }

    private var toneLabel: String {
        switch item.tone.lowercased() {
        case "good": return "Good"
        case "action": return "Tip"
        case "warning": return "Heads up"
        default: return "Info"
        }
    }

    private var chipTone: StatusChipView.Tone {
        switch item.tone.lowercased() {
        case "good": return .success
        case "warning": return .warning
        case "action": return .neutral
        default: return .neutral
        }
    }
}
