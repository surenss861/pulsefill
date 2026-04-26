import CoreGraphics

enum PFRadius {
    static let control: CGFloat = 12
    static let card: CGFloat = 16
    static let sheet: CGFloat = 20
    /// Signed-out hero / notification preview (larger than in-app cards).
    static let heroPreview: CGFloat = 24
    static let largeControl: CGFloat = 22
    /// Cream onboarding / “pass” style hero on auth landing.
    static let onboardingCard: CGFloat = 28
    /// Wallet-style appointment pass corners.
    static let passCard: CGFloat = 32
}
