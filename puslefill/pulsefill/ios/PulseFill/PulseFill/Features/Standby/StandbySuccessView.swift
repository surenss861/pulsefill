import SwiftUI

struct StandbySuccessView: View {
    let wantsPushReminders: Bool
    let onDone: () -> Void

    @EnvironmentObject private var env: AppEnvironment
    @Environment(\.openURL) private var openURL
    @State private var pushFollowUp: StandbyPushFollowUp?

    var body: some View {
        VStack(spacing: PFSpacing.lg) {
            Spacer(minLength: 24)

            Image(systemName: "bell.badge.fill")
                .font(.system(size: 52, weight: .semibold))
                .foregroundStyle(PFColor.success)

            Text(StandbyOnboardingCopy.Preference.successTitle)
                .font(.system(size: 24, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)
                .multilineTextAlignment(.center)

            Text(StandbyOnboardingCopy.Preference.successBody)
                .font(.system(size: 17, weight: .regular))
                .foregroundStyle(PFColor.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, PFSpacing.lg)

            if let followUp = pushFollowUp, followUp.message != nil || followUp.showOpenSettings {
                VStack(spacing: PFSpacing.sm) {
                    if let message = followUp.message {
                        Text(message)
                            .font(.system(size: 14, weight: .regular))
                            .foregroundStyle(PFColor.textSecondary)
                            .multilineTextAlignment(.center)
                    }
                    if followUp.showOpenSettings {
                        Button {
                            if let url = URL(string: UIApplication.openSettingsURLString) {
                                openURL(url)
                            }
                        } label: {
                            Text("Open Settings")
                                .font(.system(size: 15, weight: .semibold))
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(PFColor.primary)
                    }
                }
                .padding(.horizontal, PFSpacing.lg)
            }

            Spacer(minLength: 24)

            PrimaryCTAButton(title: StandbyOnboardingCopy.Preference.successPrimaryCTA) {
                onDone()
            }
            .padding(.horizontal, PFSpacing.lg)
            .padding(.bottom, PFSpacing.xl)
        }
        .frame(maxWidth: .infinity)
        .background(PFColor.background.ignoresSafeArea())
        .task {
            pushFollowUp = await env.pushRegistrationManager.standbyPushFollowUp(wantsPush: wantsPushReminders)
        }
    }
}
