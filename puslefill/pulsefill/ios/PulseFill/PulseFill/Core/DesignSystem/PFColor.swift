import SwiftUI

enum PFColor {
    static let background = Color(red: 0.04, green: 0.05, blue: 0.06)
    static let surface1 = Color(red: 0.075, green: 0.09, blue: 0.13)
    static let surface2 = Color(red: 0.10, green: 0.125, blue: 0.19)
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
    static let divider = Color.white.opacity(0.08)
}
