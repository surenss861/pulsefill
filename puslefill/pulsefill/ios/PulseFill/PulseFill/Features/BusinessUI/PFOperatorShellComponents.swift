import SwiftUI

// MARK: - Screen rhythm

enum PFOperatorShellMetrics {
    static let horizontalPadding: CGFloat = 20
    static let sectionSpacing: CGFloat = 24
    static let stackSpacing: CGFloat = 16
    /// Extra scroll bottom inset so last CTAs clear the tab bar + home indicator comfortably.
    static let tabBarContentInset: CGFloat = 52
    static let buttonMinHeight: CGFloat = 50
}

/// Standard horizontal padding for operator / Business scroll content.
struct PFOperatorScreenPadding: ViewModifier {
    func body(content: Content) -> some View {
        content.padding(.horizontal, PFOperatorShellMetrics.horizontalPadding)
    }
}

extension View {
    func pfOperatorHorizontalPadding() -> some View {
        modifier(PFOperatorScreenPadding())
    }

    /// Standard bottom padding for Business tab root scroll content.
    func pfOperatorTabBarContentInset() -> some View {
        padding(.bottom, PFOperatorShellMetrics.tabBarContentInset)
    }
}

// MARK: - Hero (matches premium before-auth: warm card, strong type)

struct PFOperatorHero: View {
    let overline: String
    let title: String
    let subtitle: String
    var showLivePulse: Bool = true
    var uppercaseOverline: Bool = true
    var primaryActionTitle: String?
    var primaryAction: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                if showLivePulse { PFLivePulseDot() }
                Text(uppercaseOverline ? overline.uppercased() : overline)
                    .font(.system(size: 12, weight: .semibold))
                    .kerning(uppercaseOverline ? 0.6 : 0)
                    .foregroundStyle(PFColor.textSecondary)
            }
            Text(title)
                    .font(.system(size: 32, weight: .bold))
                .foregroundStyle(PFColor.textPrimary)
                .fixedSize(horizontal: false, vertical: true)
            Text(subtitle)
                    .font(.system(size: 16, weight: .medium))
                .foregroundStyle(PFColor.textSecondary)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)

            if let primaryActionTitle, let primaryAction {
                PFOperatorPrimaryAction(title: primaryActionTitle, action: primaryAction)
                    .padding(.top, 4)
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background {
            RoundedRectangle(cornerRadius: PFRadius.sheet, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            PFColor.customerGlassElevated.opacity(0.55),
                            PFColor.surface1.opacity(0.95),
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
        }
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.sheet, style: .continuous)
                .stroke(PFColor.customerHairlineStrong, lineWidth: 1)
        )
        .shadow(color: PFColor.elevationShadowSoft, radius: 16, x: 0, y: 10)
    }
}

// MARK: - Actions

struct PFOperatorPrimaryAction: View {
    let title: String
    var isEnabled: Bool = true
    let action: () -> Void

    var body: some View {
        Button {
            PFHaptics.selection()
            action()
        } label: {
            Text(title)
                .font(.system(size: 16, weight: .bold))
                .frame(maxWidth: .infinity)
                .frame(minHeight: PFOperatorShellMetrics.buttonMinHeight)
        }
        .buttonStyle(.borderedProminent)
        .tint(PFColor.ember)
        .disabled(!isEnabled)
        .opacity(isEnabled ? 1 : 0.45)
    }
}

struct PFOperatorSecondaryAction: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button {
            PFHaptics.selection()
            action()
        } label: {
            Text(title)
                .font(.system(size: 15, weight: .semibold))
                .frame(maxWidth: .infinity)
                .frame(minHeight: PFOperatorShellMetrics.buttonMinHeight)
        }
        .buttonStyle(.bordered)
        .tint(PFColor.textSecondary)
    }
}

// MARK: - More hub row (large tappable destination)

struct PFOperatorMoreDestinationRow: View {
    let systemImage: String
    let title: String
    let subtitle: String
    let action: () -> Void

    var body: some View {
        Button {
            PFHaptics.selection()
            action()
        } label: {
            HStack(alignment: .center, spacing: 16) {
                Image(systemName: systemImage)
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(PFColor.ember)
                    .frame(width: 44, height: 44)
                    .background(PFColor.emberSoft)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(PFColor.textPrimary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Text(subtitle)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)
                        .lineSpacing(2)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(PFColor.textSecondary.opacity(0.7))
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background {
                RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                PFColor.surface2.opacity(0.65),
                                PFColor.surface1.opacity(0.92),
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            }
            .overlay(
                RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                    .stroke(PFColor.textSecondary.opacity(0.14), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
            .shadow(color: PFColor.elevationShadowSoft, radius: 10, x: 0, y: 5)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Metric strip (operator overview)

struct PFOperatorMetricStrip<Content: View>: View {
    @ViewBuilder let content: () -> Content

    var body: some View {
        HStack(spacing: 0) {
            content()
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 8)
        .background {
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            PFColor.surface2.opacity(0.5),
                            PFColor.surface1.opacity(0.88),
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
        }
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .stroke(PFColor.textSecondary.opacity(0.14), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }
}
