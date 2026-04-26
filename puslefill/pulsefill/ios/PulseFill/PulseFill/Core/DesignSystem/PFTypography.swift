import SwiftUI

enum PFTypography {
    static func hero(_ text: String) -> some View {
        Text(text).font(.system(size: 34, weight: .semibold, design: .default))
    }

    /// Signed-out brand line (PulseFill).
    static func landingBrand(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 22, weight: .bold, design: .default))
            .foregroundStyle(PFColor.textPrimary)
    }

    /// Signed-out main headline (two short lines).
    static func landingTitle(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 28, weight: .bold, design: .default))
            .foregroundStyle(PFColor.textPrimary)
            .multilineTextAlignment(.leading)
    }

    static func landingBody(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 14, weight: .medium, design: .default))
            .foregroundStyle(PFColor.textSecondary.opacity(0.92))
            .multilineTextAlignment(.leading)
            .lineSpacing(3)
            .fixedSize(horizontal: false, vertical: true)
    }

    static func title(_ text: String) -> some View {
        Text(text).font(.system(size: 24, weight: .semibold))
    }

    /// Section titles in forms (standby, settings).
    static func section(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(PFColor.textPrimary)
    }

    static func body(_ text: String) -> some View {
        Text(text).font(.system(size: 17, weight: .regular))
    }

    static func caption(_ text: String) -> some View {
        Text(text).font(.system(size: 13, weight: .regular)).foregroundStyle(PFColor.textSecondary)
    }
}
