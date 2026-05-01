import SwiftUI

struct StandbySuccessView: View {
    let wantsPushReminders: Bool
    /// When true (preferences flow), show **View openings** + **Done**; otherwise single **Continue** (onboarding).
    var showOpeningsCTA: Bool = false
    let onDone: () -> Void
    var onViewOpenings: (() -> Void)?

    @EnvironmentObject private var env: AppEnvironment
    @Environment(\.openURL) private var openURL
    @State private var pushFollowUp: StandbyPushFollowUp?

    init(
        wantsPushReminders: Bool,
        showOpeningsCTA: Bool = false,
        onDone: @escaping () -> Void,
        onViewOpenings: (() -> Void)? = nil
    ) {
        self.wantsPushReminders = wantsPushReminders
        self.showOpeningsCTA = showOpeningsCTA
        self.onDone = onDone
        self.onViewOpenings = onViewOpenings
    }

    private var titleText: String {
        showOpeningsCTA ? StandbySetupCustomerCopy.successTitle : StandbyOnboardingCopy.Preference.successTitle
    }

    private var bodyText: String {
        showOpeningsCTA ? StandbySetupCustomerCopy.successBody : StandbyOnboardingCopy.Preference.successBody
    }

    var body: some View {
        VStack(spacing: PFSpacing.lg) {
            Spacer(minLength: 24)

            Image(systemName: "bell.badge.fill")
                .font(.system(size: 52, weight: .semibold))
                .foregroundStyle(PFColor.success)

            Text(titleText)
                .font(.system(size: 24, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)
                .multilineTextAlignment(.center)

            Text(bodyText)
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

            if showOpeningsCTA, let onViewOpenings {
                VStack(spacing: 12) {
                    PFCustomerPrimaryButton(title: StandbySetupCustomerCopy.successViewOpenings, isEnabled: true) {
                        onViewOpenings()
                    }
                    PFCustomerSecondaryButton(title: StandbySetupCustomerCopy.successDone, isEnabled: true) {
                        onDone()
                    }
                }
                .padding(.horizontal, PFSpacing.lg)
            } else {
                PrimaryCTAButton(title: StandbyOnboardingCopy.Preference.successPrimaryCTA) {
                    onDone()
                }
                .padding(.horizontal, PFSpacing.lg)
            }
            Spacer(minLength: PFSpacing.md)
        }
        .frame(maxWidth: .infinity)
        .background(PFScreenBackground())
        .task {
            pushFollowUp = await env.pushRegistrationManager.standbyPushFollowUp(wantsPush: wantsPushReminders)
        }
    }
}
