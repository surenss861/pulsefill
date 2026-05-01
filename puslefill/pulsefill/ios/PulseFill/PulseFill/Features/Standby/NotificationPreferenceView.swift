import SwiftUI

struct NotificationPreferenceView: View {
    @Binding var draft: StandbyPreferenceDraft

    var body: some View {
        PFCustomerSectionCard(variant: .default, padding: 18) {
            VStack(alignment: .leading, spacing: 12) {
                Text("Stay reachable")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)

                Text(
                    "PulseFill notifies you when a matching earlier time opens. First valid claim wins — if you’re slow to respond, someone else may get it."
                )
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(PFColor.textSecondary)
                .lineSpacing(3)

                Toggle("I’ll watch for PulseFill alerts (recommended)", isOn: $draft.wantsPushReminders)
                    .font(.system(size: 15, weight: .medium))
                    .tint(PFColor.ember)

                Text(
                    "Turn on iOS notifications for PulseFill in Settings so you don’t miss a match. Your clinic may still reach you separately when needed."
                )
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(PFColor.textMuted)
                .lineSpacing(3)
            }
        }
    }
}
