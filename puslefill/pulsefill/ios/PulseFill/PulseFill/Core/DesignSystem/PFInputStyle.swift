import SwiftUI

struct PFTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(PFSpacing.md)
            .background(PFColor.surface2)
            .clipShape(RoundedRectangle(cornerRadius: PFRadius.control, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: PFRadius.control, style: .continuous)
                    .strokeBorder(Color.white.opacity(0.08), lineWidth: 1)
            )
            .foregroundStyle(PFColor.textPrimary)
    }
}
