import SwiftUI

struct NotificationPreferenceView: View {
    @Binding var draft: StandbyPreferenceDraft

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            PFTypography.section("Stay reachable")
            PFTypography.caption(
                "PulseFill notifies you when a matching earlier slot opens. First valid claim wins — if you’re slow to respond, someone else may get it."
            )

            Toggle("I’ll watch for PulseFill alerts (recommended)", isOn: $draft.wantsPushReminders)
                .padding(PFSpacing.md)
                .background(PFSurface.card)
                .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))

            PFTypography.caption(
                "Turn on iOS notifications for PulseFill in Settings so you don’t miss a match. SMS/email on your account are handled separately by your clinic when available."
            )
        }
    }
}
