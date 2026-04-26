import SwiftUI

enum PFColor {
    /// Deepest app chrome (signed-out / dark shells).
    static let ink = Color(red: 0.03, green: 0.035, blue: 0.045)
    static let background = Color(red: 0.04, green: 0.05, blue: 0.06)
    static let surface1 = Color(red: 0.075, green: 0.09, blue: 0.13)
    static let surface2 = Color(red: 0.10, green: 0.125, blue: 0.19)
    /// Slightly lifted surface for stacked cards.
    static let inkElevated = surface1
    // Ember-first accent palette aligned with web operator surfaces.
    static let primary = Color(red: 1.0, green: 0.48, blue: 0.10)
    static let primaryDark = Color(red: 0.90, green: 0.36, blue: 0.07)
    static let primarySoft = Color(red: 1.0, green: 0.48, blue: 0.10).opacity(0.14)
    static let primaryBorder = Color(red: 1.0, green: 0.69, blue: 0.44).opacity(0.40)
    static let primaryText = Color(red: 1.0, green: 0.69, blue: 0.44)
    static let success = Color(red: 0.14, green: 0.76, blue: 0.42)
    static let warning = Color(red: 0.96, green: 0.72, blue: 0.24)
    static let error = Color(red: 0.95, green: 0.35, blue: 0.35)
    static let textPrimary = Color(red: 0.96, green: 0.97, blue: 0.98)
    static let textSecondary = Color(red: 0.60, green: 0.64, blue: 0.70)
    static let textMuted = Color(red: 0.52, green: 0.56, blue: 0.62)
    static let textDim = Color(red: 0.44, green: 0.48, blue: 0.54)
    static let divider = Color.white.opacity(0.08)
    static let hairline = Color.white.opacity(0.10)
    static let glassTint = Color.white.opacity(0.055)

    // MARK: - Signed-out onboarding (cream card on warm dark chrome)

    static let onboardingCreamLight = Color(red: 1.0, green: 0.965, blue: 0.90)
    static let onboardingCreamDeep = Color(red: 0.94, green: 0.88, blue: 0.79)
    static let onboardingCardInk = Color(red: 0.08, green: 0.075, blue: 0.065)
    static let onboardingCardBrown = Color(red: 0.52, green: 0.25, blue: 0.08)
    static let onboardingTodayPillForeground = Color(red: 0.95, green: 0.42, blue: 0.08)
    static let onboardingTodayPillBackground = Color(red: 1.0, green: 0.48, blue: 0.10).opacity(0.14)

    // MARK: - Auth appointment pass (hierarchy + signifiers on cream)

    static let passBadgeFill = Color(red: 0.33, green: 0.16, blue: 0.07).opacity(0.12)
    static let passBadgeIcon = Color(red: 0.48, green: 0.22, blue: 0.07)
    static let passOpeningLabel = Color(red: 0.42, green: 0.28, blue: 0.18)
    static let passTodayPillForeground = Color(red: 0.90, green: 0.35, blue: 0.04)
    static let passTodayPillBackground = Color(red: 1.0, green: 0.50, blue: 0.12).opacity(0.14)
    static let passTitle = Color(red: 0.07, green: 0.06, blue: 0.05)
    static let passTimeBlock = Color(red: 0.10, green: 0.08, blue: 0.06)
    static let passChipForeground = Color(red: 0.48, green: 0.22, blue: 0.07)
    static let passChipBackground = Color(red: 0.48, green: 0.22, blue: 0.07).opacity(0.10)
    static let passCreamTop = Color(red: 1.0, green: 0.965, blue: 0.89)
    static let passCreamBottom = Color(red: 0.965, green: 0.90, blue: 0.79)
    static let passAlertDot = Color(red: 0.13, green: 0.72, blue: 0.38)
}
