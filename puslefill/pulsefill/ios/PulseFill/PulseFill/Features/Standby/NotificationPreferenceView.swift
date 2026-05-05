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
                    "PulseFill can alert you when a matching opening becomes available. Some openings move quickly, so timely alerts help you respond sooner."
                )
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(PFColor.textSecondary)
                .lineSpacing(3)

                Toggle("I’ll watch for PulseFill alerts (recommended)", isOn: $draft.wantsPushReminders)
                    .font(.system(size: 15, weight: .medium))
                    .tint(PFColor.ember)

                Text(
                    "Turn on iOS notifications for PulseFill in Settings so you don’t miss matching openings. The business may still contact you separately when needed."
                )
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(PFColor.textMuted)
                .lineSpacing(3)
            }
        }
    }
}
