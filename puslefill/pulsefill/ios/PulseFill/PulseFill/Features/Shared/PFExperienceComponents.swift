import SwiftUI

enum PFCustomerShellMetrics {
    static let horizontalPadding: CGFloat = 20
    static let sectionSpacing: CGFloat = 24
    static let cardPadding: CGFloat = 20
    static let compactCardPadding: CGFloat = 16
    static let buttonMinHeight: CGFloat = 50
    static let tabBarContentInset: CGFloat = 52
}

/// Shared premium hero for both customer and business surfaces.
struct PFEmberHero: View {
    let overline: String
    let title: String
    let subtitle: String
    var showPulse: Bool = true
    var primaryActionTitle: String?
    var primaryAction: (() -> Void)?

    var body: some View {
        PFCustomerSectionCard(variant: .elevated, padding: PFCustomerShellMetrics.cardPadding) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 8) {
                    if showPulse { PFLivePulseDot() }
                    Text(overline.uppercased())
                        .font(.system(size: 11, weight: .semibold))
                        .tracking(0.9)
                        .foregroundStyle(PFColor.customerTextSecondary)
                }

                Text(title)
                    .font(.system(size: 32, weight: .bold))
                    .foregroundStyle(PFColor.customerTextPrimary)
                    .fixedSize(horizontal: false, vertical: true)

                Text(subtitle)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(PFColor.customerTextSecondary)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)

                if let primaryActionTitle, let primaryAction {
                    PFCustomerPrimaryButton(title: primaryActionTitle, action: primaryAction)
                        .padding(.top, 6)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

/// Reusable customer empty-state moment with one obvious action.
struct PFEmptyMoment: View {
    let systemImage: String
    let title: String
    let message: String
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        CustomerEmptyStateCard(
            systemImage: systemImage,
            title: title,
            message: message,
            footnote: nil,
            primaryActionTitle: actionTitle,
            primaryAction: {
                PFHaptics.selection()
                action?()
            },
            secondaryActionTitle: nil,
            secondaryAction: nil
        )
    }
}

/// Reusable customer error moment with a clear retry action.
struct PFErrorMoment: View {
    let title: String
    let message: String
    var actionTitle: String = "Try again"
    let action: () -> Void
    var secondaryTitle: String?
    var secondaryAction: (() -> Void)?

    var body: some View {
        PFCustomerErrorState(
            title: title,
            message: message,
            primaryTitle: actionTitle,
            primaryAction: {
                PFHaptics.selection()
                action()
            },
            secondaryTitle: secondaryTitle,
            secondaryAction: {
                PFHaptics.selection()
                secondaryAction?()
            },
            style: .compact
        )
    }
}
