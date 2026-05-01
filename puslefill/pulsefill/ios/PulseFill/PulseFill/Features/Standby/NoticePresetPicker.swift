import SwiftUI

struct NoticePresetPicker: View {
    @Binding var maxNoticeHours: Int

    private let presets: [Int] = [1, 2, 4, 8, 24, 48]

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
                ForEach(presets, id: \.self) { hours in
                    let isSelected = maxNoticeHours == hours
                    Button {
                        maxNoticeHours = hours
                    } label: {
                        Text(StandbySetupCustomerCopy.noticePresetShortLabel(hours: hours))
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
                Text("Custom: \(StandbySetupCustomerCopy.noticeSummaryLabel(hours: maxNoticeHours)) minimum")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
            }
        }
    }
}
