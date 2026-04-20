import SwiftUI

struct StandbyOnboardingCompleteView: View {
    let activePreferenceCount: Int
    let notificationsEnabled: Bool
    let onViewStatus: () -> Void
    let onDone: () -> Void
    let onAddAnotherPreference: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Spacer(minLength: 12)

            VStack(alignment: .leading, spacing: 12) {
                Text(StandbyOnboardingCopy.Progress.step4.uppercased())
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(PFColor.textSecondary)

                Text(StandbyOnboardingCopy.Complete.headline)
                    .font(.system(size: 30, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)

                Text(StandbyOnboardingCopy.Complete.subhead)
                    .font(.system(size: 17, weight: .regular))
                    .foregroundStyle(PFColor.textSecondary)
            }

            VStack(spacing: 12) {
                CompletionBulletCard(text: StandbyOnboardingCopy.Complete.bullet1)
                CompletionBulletCard(text: StandbyOnboardingCopy.Complete.bullet2)
                CompletionBulletCard(text: StandbyOnboardingCopy.Complete.bullet3)
            }

            VStack(alignment: .leading, spacing: 10) {
                Text(StandbyOnboardingCopy.Complete.recapTitle)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)

                HStack {
                    Text(StandbyOnboardingCopy.Complete.standbyLabel)
                        .font(.system(size: 13, weight: .regular))
                        .foregroundStyle(PFColor.textSecondary)

                    Spacer()

                    Text("\(activePreferenceCount) active")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(PFColor.textPrimary)
                }

                HStack {
                    Text(StandbyOnboardingCopy.Complete.notificationsLabel)
                        .font(.system(size: 13, weight: .regular))
                        .foregroundStyle(PFColor.textSecondary)

                    Spacer()

                    Text(
                        notificationsEnabled
                            ? StandbyOnboardingCopy.Complete.notificationsOn
                            : StandbyOnboardingCopy.Complete.notificationsOff
                    )
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)
                }
            }
            .padding(16)
            .background(PFSurface.card)
            .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))

            if !notificationsEnabled {
                Text(StandbyOnboardingCopy.Complete.reassuranceWhenPushOff)
                    .font(.system(size: 14, weight: .regular))
                    .foregroundStyle(PFColor.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer()

            VStack(spacing: 12) {
                Button(StandbyOnboardingCopy.Complete.primaryCTA) {
                    onViewStatus()
                }
                .pfPrimaryButtonStyle()

                Button(StandbyOnboardingCopy.Complete.secondaryCTA) {
                    onDone()
                }
                .buttonStyle(.plain)
                    .foregroundStyle(PFColor.textSecondary)

                Button(StandbyOnboardingCopy.Preference.successSecondaryCTA) {
                    onAddAnotherPreference()
                }
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(PFColor.primary)
                .padding(.top, 4)

                Text(StandbyOnboardingCopy.Complete.footer)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundStyle(PFColor.textSecondary)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
                    .padding(.top, 4)
            }
        }
        .padding(20)
        .background(PFColor.background.ignoresSafeArea())
    }
}

private struct CompletionBulletCard: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Circle()
                .fill(PFColor.success.opacity(0.22))
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
