import CoreGraphics

enum PFRadius {
    static let control: CGFloat = 12
    static let card: CGFloat = 16
    static let sheet: CGFloat = 20
    /// Signed-out hero / notification preview (larger than in-app cards).
    static let heroPreview: CGFloat = 24
    static let largeControl: CGFloat = 22
    /// Large controls / primary buttons (customer companion).
    static let controlLarge: CGFloat = 22
    /// Cream onboarding / “pass” style hero on auth landing.
    static let onboardingCard: CGFloat = 28
    /// Wallet-style appointment pass corners (compact, not billboard).
    static let passCard: CGFloat = 26
    /// Customer in-app appointment pass (slightly rounder than compact auth preview).
    static let pass: CGFloat = 28
    /// Large secondary cards (standby blocks, wide panels).
    static let cardLarge: CGFloat = 24
    /// Default customer dark section cards.
    static let customerCard: CGFloat = 18
    /// Pills: use `Capsule()` in SwiftUI — no numeric corner radius.
}
