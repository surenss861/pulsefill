import SwiftUI

struct ShineEffect: ViewModifier {
    func body(content: Content) -> some View {
        content.overlay(
            LinearGradient(colors: [.white.opacity(0), .white.opacity(0.12), .white.opacity(0)], startPoint: .topLeading, endPoint: .bottomTrailing)
                .blendMode(.plusLighter)
                .allowsHitTesting(false)
        )
    }
}
