import SwiftUI

struct NoticePresetPicker: View {
    @Binding var maxNoticeHours: Int

    private let presets: [(Int, String)] = [
        (1, "1h"),
        (2, "2h"),
        (4, "4h"),
        (8, "8h"),
        (24, "1 day"),
        (48, "2 days"),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            LazyVGrid(
                columns: [
                    GridItem(.flexible(), spacing: 8),
                    GridItem(.flexible(), spacing: 8),
                    GridItem(.flexible(), spacing: 8),
                ],
                spacing: 8
            ) {
                ForEach(presets, id: \.0) { hours, label in
                    let isSelected = maxNoticeHours == hours
                    Button {
                        maxNoticeHours = hours
                    } label: {
                        Text(label)
                            .font(.system(size: 13, weight: .semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(isSelected ? PFColor.primary.opacity(0.18) : Color.white.opacity(0.06))
                            .foregroundStyle(isSelected ? PFColor.primary : PFColor.textPrimary)
                            .overlay(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .stroke(isSelected ? PFColor.primary.opacity(0.35) : Color.white.opacity(0.08), lineWidth: 1)
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }

            Stepper(value: $maxNoticeHours, in: 1 ... 72) {
                Text("Custom: \(maxNoticeHours) hour\(maxNoticeHours == 1 ? "" : "s") minimum notice")
                    .font(.system(size: 14, weight: .regular))
                    .foregroundStyle(PFColor.textSecondary)
            }
        }
        .padding(PFSpacing.md)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }
}
