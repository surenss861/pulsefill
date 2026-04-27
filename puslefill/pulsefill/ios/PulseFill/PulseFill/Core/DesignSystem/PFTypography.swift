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

    // MARK: - Customer app (SF Pro, controlled scale)

    enum Customer {
        /// Main hero line on a screen (e.g. Home headline).
        static func screenTitle(_ text: String) -> some View {
            Text(text)
                .font(.system(size: 34, weight: .bold, design: .default))
                .foregroundStyle(PFColor.textPrimary)
                .lineSpacing(3)
        }

        /// Greeting / secondary screen lead.
        static func screenSubtitle(_ text: String) -> some View {
            Text(text)
                .font(.system(size: 16, weight: .semibold, design: .default))
                .foregroundStyle(PFColor.textSecondary)
        }

        /// Supporting line under a screen title (Offers / Activity / Profile).
        static func screenLead(_ text: String) -> some View {
            Text(text)
                .font(.system(size: 16, weight: .semibold, design: .default))
                .foregroundStyle(PFColor.customerMutedText)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
        }

        /// Primary line on a card (service name, section header).
        static func cardTitle(_ text: String) -> some View {
            Text(text)
                .font(.system(size: 22, weight: .bold, design: .default))
                .foregroundStyle(PFColor.textPrimary)
        }

        /// Secondary meta on a card (clinic, supporting line).
        static func cardMeta(_ text: String) -> some View {
            Text(text)
                .font(.system(size: 16, weight: .semibold, design: .default))
                .foregroundStyle(PFColor.textSecondary)
        }

        /// Uppercase / eyebrow labels (STANDBY, AVAILABLE OPENINGS).
        static func label(_ text: String) -> some View {
            Text(text)
                .font(.system(size: 12, weight: .bold, design: .default))
                .foregroundStyle(PFColor.textMuted)
                .textCase(.uppercase)
                .tracking(0.6)
        }

        /// Primary button label style (caller wraps in `Button`).
        static func button(_ text: String) -> some View {
            Text(text)
                .font(.system(size: 17, weight: .bold, design: .default))
        }
    }
}
