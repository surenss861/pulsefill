import SwiftUI

/// Canonical PulseFill palette — keep in sync with `apps/dashboard-web/app/globals.css` `--pf-brand-*`.
enum PFBrandColor {
    static let ink950 = Color(red: 11 / 255, green: 9 / 255, blue: 7 / 255)
    static let ink925 = Color(red: 16 / 255, green: 13 / 255, blue: 10 / 255)
    static let brown900 = Color(red: 20 / 255, green: 16 / 255, blue: 13 / 255)
    static let brown850 = Color(red: 26 / 255, green: 21 / 255, blue: 16 / 255)
    static let brown800 = Color(red: 33 / 255, green: 27 / 255, blue: 20 / 255)
    static let brown750 = Color(red: 42 / 255, green: 34 / 255, blue: 25 / 255)

    static let textStrong = Color(red: 244 / 255, green: 238 / 255, blue: 231 / 255)
    static let text = Color(red: 232 / 255, green: 222 / 255, blue: 210 / 255)
    static let textMuted = Color(red: 169 / 255, green: 157 / 255, blue: 144 / 255)
    static let textFaint = Color(red: 116 / 255, green: 107 / 255, blue: 98 / 255)

    static let ember = Color(red: 255 / 255, green: 122 / 255, blue: 24 / 255)
    static let success = Color(red: 123 / 255, green: 217 / 255, blue: 154 / 255)
}

enum PFColor {
    /// Deepest app chrome (signed-out / dark shells) — warm ink, aligned with web `--pf-brand-ink-950`.
    static let ink = PFBrandColor.ink950
    /// Warm near-black (customer “appointment companion” chrome).
    static let customerInk = PFBrandColor.ink925
    static let customerInkDeep = PFBrandColor.ink950
    // MARK: - Customer dark glass (elevated surfaces, appointment passes)

    static let customerGlass = PFBrandColor.brown800
    /// Top of pass / elevated cards — slightly lifted for separation from warm near-black chrome.
    static let customerGlassElevated = PFBrandColor.brown750
    static let customerGlassDeep = PFBrandColor.brown900
    static let customerHairline = Color(red: 1.0, green: 237 / 255, blue: 190 / 255).opacity(0.1)
    static let customerHairlineStrong = Color(red: 1.0, green: 237 / 255, blue: 190 / 255).opacity(0.16)
    static let customerTopGlow = Color(red: 1.0, green: 0.36, blue: 0.06).opacity(0.11)
    static let customerSuccessGlow = PFBrandColor.success.opacity(0.085)
    static let emberGlow = PFBrandColor.ember.opacity(0.22)
    /// Ember wash for chips / icon tiles on dark glass.
    static let emberSoft = PFBrandColor.ember.opacity(0.13)
    static let emberReadable = Color(red: 1.0, green: 0.64, blue: 0.34)
    static let customerTextPrimary = PFBrandColor.textStrong
    static let customerTextSecondary = PFBrandColor.text
    static let customerTextTertiary = PFBrandColor.textMuted

    /// Secondary dark cards (customer home / offers / activity) — same family as glass.
    static let customerCard = customerGlass
    static let customerCardElevated = customerGlassElevated
    /// Bottom tab chrome (opaque; pairs with `.toolbarBackground`).
    static let customerTabBar = PFBrandColor.brown900
    /// Business / operator tab bar — warm walnut (aligned with web shell).
    static let operatorTabBar = PFBrandColor.brown900
    /// Sticky footer / action bar on customer flows.
    static let customerStickyBar = PFBrandColor.brown850

    static let background = PFBrandColor.ink950
    static let surface1 = PFBrandColor.brown900
    static let surface2 = PFBrandColor.brown850
    /// Slightly lifted surface for stacked cards.
    static let inkElevated = surface1
    // Ember-first accent palette aligned with web operator surfaces.
    /// High-conversion CTA / selected chrome (slightly brighter than `primary`).
    static let ember = PFBrandColor.ember
    static let emberText = Color(red: 0.52, green: 0.23, blue: 0.06)
    static let primary = PFBrandColor.ember
    static let primaryDark = Color(red: 0.90, green: 0.36, blue: 0.07)
    static let primarySoft = PFBrandColor.ember.opacity(0.14)
    static let primaryBorder = Color(red: 1.0, green: 0.69, blue: 0.44).opacity(0.40)
    static let primaryText = Color(red: 1.0, green: 0.69, blue: 0.44)
    static let success = PFBrandColor.success
    static let warning = Color(red: 0.96, green: 0.72, blue: 0.24)
    static let error = Color(red: 0.95, green: 0.35, blue: 0.35)
    static let textPrimary = PFBrandColor.textStrong
    static let textSecondary = PFBrandColor.text
    static let textMuted = PFBrandColor.textMuted
    static let textDim = PFBrandColor.textFaint
    /// Customer-facing muted / de-emphasized (slightly brighter than `textSecondary` on warm black).
    static let customerMutedText = PFBrandColor.textMuted
    static let customerDimText = PFBrandColor.textFaint.opacity(0.92)
    static let divider = Color(red: 1.0, green: 237 / 255, blue: 190 / 255).opacity(0.08)
    static let hairline = Color(red: 1.0, green: 237 / 255, blue: 190 / 255).opacity(0.1)
    static let glassTint = Color(red: 1.0, green: 246 / 255, blue: 235 / 255).opacity(0.055)

    // MARK: - Warm elevation (avoid pure black shadows)

    /// Primary card depth — brown-tinted, matches web operations-desk surfaces.
    static let elevationShadow = PFBrandColor.brown900.opacity(0.48)
    /// Secondary lift (rows, compact cards).
    static let elevationShadowSoft = PFBrandColor.brown900.opacity(0.30)
    /// Strong depth (pass / hero) without neutral black.
    static let elevationShadowDeep = PFBrandColor.ink950.opacity(0.52)

    /// Neutral chip / pill wash on dark walnut (replaces cold `Color.white.opacity` fills).
    static let chipWash = Color(red: 1.0, green: 246 / 255, blue: 235 / 255).opacity(0.045)
    static let chipWashStrong = Color(red: 1.0, green: 246 / 255, blue: 235 / 255).opacity(0.072)

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
    static let passTodayPillBackground = PFBrandColor.ember.opacity(0.14)
    static let passTitle = customerTextPrimary
    static let passTimeBlock = customerTextPrimary
    static let passChipForeground = emberReadable
    static let passChipBackground = emberSoft
    /// Legacy cream stops (signed-out onboarding only); customer passes use glass gradients in views.
    static let passCreamTop = Color(red: 1.0, green: 0.965, blue: 0.89)
    static let passCreamBottom = Color(red: 0.965, green: 0.90, blue: 0.79)
    static let passCream = passCreamTop
    static let passCreamDeep = passCreamBottom
    static let passAlertDot = PFBrandColor.success
}
