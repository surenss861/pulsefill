import SwiftUI

struct NoticeWindowSelectionView: View {
    @Binding var draft: StandbyPreferenceDraft

    var body: some View {
        PFCustomerSectionCard(variant: .default, padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                Text("How much notice do you need?")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)

                Text("Choose how soon before an opening you’re comfortable being notified.")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)

                NoticePresetPicker(maxNoticeHours: $draft.maxNoticeHours)

                VStack(alignment: .leading, spacing: 12) {
                    Stepper(value: $draft.maxDistanceKm, in: 1 ... 200) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Up to \(draft.maxDistanceKm) km away")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(PFColor.textPrimary)
                            Text(StandbySetupCustomerCopy.distanceCaption)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(PFColor.textMuted)
                        }
                    }

                    Toggle(StandbySetupCustomerCopy.depositToggle, isOn: $draft.depositOk)
                        .font(.system(size: 15, weight: .medium))
                        .tint(PFColor.ember)
                }
                .padding(.top, 4)
            }
        }
    }
}
