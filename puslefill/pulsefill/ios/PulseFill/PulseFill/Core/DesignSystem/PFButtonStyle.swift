import SwiftUI

struct PFPrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(PFColor.background)
            .padding(.horizontal, PFSpacing.lg)
            .padding(.vertical, PFSpacing.sm + 2)
            .background(PFColor.primary.opacity(configuration.isPressed ? 0.85 : 1))
            .clipShape(RoundedRectangle(cornerRadius: PFRadius.control, style: .continuous))
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}
