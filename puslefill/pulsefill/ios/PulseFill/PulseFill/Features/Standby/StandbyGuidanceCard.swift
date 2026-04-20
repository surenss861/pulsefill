import SwiftUI

struct StandbyGuidanceCard: View {
    let item: StandbyGuidanceItem

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            StatusChipView(text: toneLabel, tone: chipTone)
            Text(item.title)
                .font(.system(size: 15, weight: .regular))
                .foregroundStyle(PFColor.textPrimary)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .strokeBorder(Color.white.opacity(0.06), lineWidth: 1)
        )
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
