import SwiftUI

enum PFColor {
    /// Deepest app chrome (signed-out / dark shells).
    static let ink = Color(red: 0.03, green: 0.035, blue: 0.045)
    /// Warm near-black (customer “appointment companion” chrome).
    static let customerInk = Color(red: 0.035, green: 0.022, blue: 0.018)
    static let customerInkDeep = Color(red: 0.012, green: 0.011, blue: 0.013)
    // MARK: - Customer dark glass (elevated surfaces, appointment passes)

    static let customerGlass = Color(red: 0.082, green: 0.079, blue: 0.084)
    /// Top of pass / elevated cards — slightly lifted for separation from warm near-black chrome.
    static let customerGlassElevated = Color(red: 0.118, green: 0.108, blue: 0.104)
    static let customerGlassDeep = Color(red: 0.048, green: 0.046, blue: 0.051)
    static let customerHairline = Color.white.opacity(0.095)
    static let customerHairlineStrong = Color.white.opacity(0.14)
    static let customerTopGlow = Color(red: 1.0, green: 0.36, blue: 0.06).opacity(0.16)
    static let customerSuccessGlow = Color(red: 0.11, green: 0.72, blue: 0.38).opacity(0.10)
    static let emberGlow = Color(red: 1.0, green: 0.42, blue: 0.05).opacity(0.22)
    /// Ember wash for chips / icon tiles on dark glass.
    static let emberSoft = Color(red: 1.0, green: 0.42, blue: 0.05).opacity(0.13)
    static let emberReadable = Color(red: 1.0, green: 0.64, blue: 0.34)
    static let customerTextPrimary = Color.white.opacity(0.96)
    static let customerTextSecondary = Color.white.opacity(0.62)
    static let customerTextTertiary = Color.white.opacity(0.40)

    /// Secondary dark cards (customer home / offers / activity) — same family as glass.
    static let customerCard = customerGlass
    static let customerCardElevated = customerGlassElevated
    /// Bottom tab chrome (opaque; pairs with `.toolbarBackground`).
    static let customerTabBar = Color(red: 0.055, green: 0.048, blue: 0.045)
    /// Sticky footer / action bar on customer flows.
    static let customerStickyBar = Color(red: 0.06, green: 0.052, blue: 0.05)

    static let background = Color(red: 0.04, green: 0.05, blue: 0.06)
    static let surface1 = Color(red: 0.075, green: 0.09, blue: 0.13)
    static let surface2 = Color(red: 0.10, green: 0.125, blue: 0.19)
    /// Slightly lifted surface for stacked cards.
    static let inkElevated = surface1
    // Ember-first accent palette aligned with web operator surfaces.
    /// High-conversion CTA / selected chrome (slightly brighter than `primary`).
    static let ember = Color(red: 1.0, green: 0.42, blue: 0.05)
    static let emberText = Color(red: 0.52, green: 0.23, blue: 0.06)
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
    /// Customer-facing muted / de-emphasized (slightly brighter than `textSecondary` on warm black).
    static let customerMutedText = Color(red: 0.62, green: 0.64, blue: 0.70)
    static let customerDimText = Color.white.opacity(0.38)
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

    // MARK: - Auth / customer appointment pass (dark glass + ember)

    static let passBadgeFill = emberSoft
    static let passBadgeIcon = emberReadable
    static let passOpeningLabel = customerTextSecondary
    static let passTodayPillForeground = emberReadable
    static let passTodayPillBackground = Color(red: 1.0, green: 0.42, blue: 0.05).opacity(0.14)
    static let passTitle = customerTextPrimary
    static let passTimeBlock = customerTextPrimary
    static let passChipForeground = emberReadable
    static let passChipBackground = emberSoft
    /// Legacy cream stops (signed-out onboarding only); customer passes use glass gradients in views.
    static let passCreamTop = Color(red: 1.0, green: 0.965, blue: 0.89)
    static let passCreamBottom = Color(red: 0.965, green: 0.90, blue: 0.79)
    static let passCream = passCreamTop
    static let passCreamDeep = passCreamBottom
    static let passAlertDot = Color(red: 0.13, green: 0.72, blue: 0.38)
}
