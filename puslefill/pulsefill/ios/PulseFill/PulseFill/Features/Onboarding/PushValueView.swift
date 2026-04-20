import SwiftUI
import UIKit
import UserNotifications

struct PushValueView: View {
    @EnvironmentObject private var env: AppEnvironment
    @Environment(\.openURL) private var openURL

    let onContinue: () -> Void
    let onSkip: () -> Void

    @State private var isRequesting = false
    @State private var followUpMessage: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Spacer(minLength: 12)

            VStack(alignment: .leading, spacing: 12) {
                Text(StandbyOnboardingCopy.Progress.step2.uppercased())
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(PFColor.textSecondary)

                Text(StandbyOnboardingCopy.Push.headline)
                    .font(.system(size: 30, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)

                Text(StandbyOnboardingCopy.Push.subhead)
                    .font(.system(size: 17, weight: .regular))
                    .foregroundStyle(PFColor.textSecondary)
            }

            VStack(spacing: 12) {
                PushBenefitRow(text: StandbyOnboardingCopy.Push.benefit1)
                PushBenefitRow(text: StandbyOnboardingCopy.Push.benefit2)
                PushBenefitRow(text: StandbyOnboardingCopy.Push.benefit3)
            }

            if let followUpMessage, !followUpMessage.isEmpty {
                Text(followUpMessage)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundStyle(PFColor.textSecondary)
                    .padding(.top, 4)
            }

            Spacer()

            VStack(spacing: 12) {
                primaryControls

                Button(StandbyOnboardingCopy.Push.secondaryCTA) {
                    onSkip()
                }
                .buttonStyle(.plain)
                .foregroundStyle(PFColor.textSecondary)

                Text(StandbyOnboardingCopy.Push.footer)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundStyle(PFColor.textSecondary)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
                    .padding(.top, 4)
            }
        }
        .padding(20)
        .background(PFColor.background.ignoresSafeArea())
        .task {
            await env.pushRegistrationManager.refreshAuthorizationStatus()
        }
    }

    @ViewBuilder
    private var primaryControls: some View {
        switch env.pushRegistrationManager.authorizationStatus {
        case .denied:
            VStack(alignment: .leading, spacing: 8) {
                Text(StandbyOnboardingCopy.Push.deniedHeadline)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)

                Text(StandbyOnboardingCopy.Push.deniedBody)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundStyle(PFColor.textSecondary)

                Button(StandbyOnboardingCopy.Push.deniedCTA) {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        openURL(url)
                    }
                }
                .pfPrimaryButtonStyle()

                Button("Continue") {
                    onContinue()
                }
                .foregroundStyle(PFColor.primary)
                .padding(.top, 4)
            }

        default:
            Button {
                Task { await requestPush() }
            } label: {
                Text(isRequesting ? "Turning on…" : StandbyOnboardingCopy.Push.primaryCTA)
                    .frame(maxWidth: .infinity)
            }
            .pfPrimaryButtonStyle()
            .disabled(isRequesting)
        }
    }

    private func requestPush() async {
        isRequesting = true
        defer { isRequesting = false }

        let result = await env.pushRegistrationManager.standbyPushFollowUp(wantsPush: true)
        followUpMessage = result.message

        await env.pushRegistrationManager.refreshAuthorizationStatus()
        if env.pushRegistrationManager.isPushAuthorizedForUI {
            onContinue()
        }
    }
}

private struct PushBenefitRow: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Circle()
                .fill(PFColor.primary.opacity(0.22))
                .frame(width: 10, height: 10)
                .padding(.top, 6)

            Text(text)
                .font(.system(size: 17, weight: .regular))
                .foregroundStyle(PFColor.textPrimary)

            Spacer(minLength: 0)
        }
        .padding(16)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }
}
