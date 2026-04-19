import SwiftUI

enum PFTypography {
    static func hero(_ text: String) -> some View {
        Text(text).font(.system(size: 34, weight: .semibold, design: .default))
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
