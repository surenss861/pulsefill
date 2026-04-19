import SwiftUI

struct NoticeWindowSelectionView: View {
    @Binding var draft: StandbyPreferenceDraft

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            PFTypography.section("How much notice do you need?")
            PFTypography.caption(
                "This tells PulseFill how last-minute an opening can still be useful. Same-day openings need a notice window that fits your schedule."
            )

            NoticePresetPicker(maxNoticeHours: $draft.maxNoticeHours)

            VStack(alignment: .leading, spacing: 12) {
                Stepper(value: $draft.maxDistanceKm, in: 1 ... 200) {
                    Text("Up to \(draft.maxDistanceKm) km away")
                        .font(.system(size: 17, weight: .regular))
                        .foregroundStyle(PFColor.textPrimary)
                }
                .padding(PFSpacing.md)
                .background(PFSurface.card)
                .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))

                Toggle("I’m OK if a deposit is required to claim", isOn: $draft.depositOk)
                    .padding(PFSpacing.md)
                    .background(PFSurface.card)
                    .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
            }
        }
    }
}
