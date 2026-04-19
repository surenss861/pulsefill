import SwiftUI

struct MascotIntroView: View {
    var body: some View {
        ZStack {
            Circle()
                .fill(.ultraThinMaterial)
                .frame(width: 120, height: 120)
                .overlay(Circle().stroke(PFColor.primary.opacity(0.5), lineWidth: 2))
            Image(systemName: "dot.radiowaves.left.and.right")
                .font(.system(size: 44, weight: .medium))
                .foregroundStyle(PFColor.primary)
                .modifier(HolographicModifier())
        }
        .accessibilityLabel("Pulse signal")
    }
}
