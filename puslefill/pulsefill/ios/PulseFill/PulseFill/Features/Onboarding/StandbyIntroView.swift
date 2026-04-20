import SwiftUI

struct StandbyIntroView: View {
    let onContinue: () -> Void
    let onSkip: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Spacer(minLength: 12)

            VStack(alignment: .leading, spacing: 12) {
                Text(StandbyOnboardingCopy.Progress.step1.uppercased())
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(PFColor.textSecondary)

                Text(StandbyOnboardingCopy.Intro.headline)
                    .font(.system(size: 30, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)

                Text(StandbyOnboardingCopy.Intro.subhead)
                    .font(.system(size: 17, weight: .regular))
                    .foregroundStyle(PFColor.textSecondary)
            }

            VStack(spacing: 12) {
                OnboardingBulletCard(
                    title: StandbyOnboardingCopy.Intro.bullet1Title,
                    detail: StandbyOnboardingCopy.Intro.bullet1Body
                )

                OnboardingBulletCard(
                    title: StandbyOnboardingCopy.Intro.bullet2Title,
                    detail: StandbyOnboardingCopy.Intro.bullet2Body
                )

                OnboardingBulletCard(
                    title: StandbyOnboardingCopy.Intro.bullet3Title,
                    detail: StandbyOnboardingCopy.Intro.bullet3Body
                )
            }

            Spacer()

            VStack(spacing: 12) {
                Button(StandbyOnboardingCopy.Intro.primaryCTA) {
                    onContinue()
                }
                .pfPrimaryButtonStyle()

                Button(StandbyOnboardingCopy.Intro.secondaryCTA) {
                    onSkip()
                }
                .buttonStyle(.plain)
                .foregroundStyle(PFColor.textSecondary)

                Text(StandbyOnboardingCopy.Intro.footer)
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

private struct OnboardingBulletCard: View {
    let title: String
    let detail: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Circle()
                .fill(PFColor.primary.opacity(0.22))
                .frame(width: 10, height: 10)
                .padding(.top, 6)

            VStack(alignment: .leading, spacing: 6) {
                Text(title)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)

                Text(detail)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundStyle(PFColor.textSecondary)
            }

            Spacer(minLength: 0)
        }
        .padding(16)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }
}
