import SwiftUI

struct OnboardingContainerView: View {
    @Binding var isComplete: Bool
    @State private var page = 0

    var body: some View {
        VStack(alignment: .leading, spacing: PFSpacing.lg) {
            MascotIntroView()
            PFTypography.hero("Get earlier appointments")
            PFTypography.caption("Join standby, set preferences, and claim openings when businesses send you offers.")
            Spacer()
            HStack {
                Button("Skip") { isComplete = true }
                    .foregroundStyle(PFColor.textSecondary)
                Spacer()
                Button(page == 0 ? "Next" : "Done") {
                    if page == 0 { page = 1 } else { isComplete = true }
                }
                .buttonStyle(PFPrimaryButtonStyle())
            }
        }
        .padding(PFSpacing.xl)
        .background(PFColor.background.ignoresSafeArea())
    }
}
