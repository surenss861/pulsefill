import SwiftUI

struct HolographicModifier: ViewModifier {
    @State private var phase: CGFloat = 0

    func body(content: Content) -> some View {
        content
            .overlay(
                AngularGradient(gradient: Gradient(colors: [.cyan.opacity(0.35), .purple.opacity(0.35), .mint.opacity(0.35), .cyan.opacity(0.35)]), center: .center)
                    .blendMode(.screen)
                    .opacity(0.55)
                    .rotationEffect(.degrees(phase))
                    .allowsHitTesting(false)
            )
            .onAppear {
                withAnimation(.linear(duration: 6).repeatForever(autoreverses: false)) {
                    phase = 360
                }
            }
    }
}
