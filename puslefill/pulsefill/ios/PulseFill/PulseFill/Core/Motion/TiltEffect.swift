import SwiftUI

/// Subtle parallax tilt placeholder (extend with `MotionManager` if needed).
struct TiltEffect: ViewModifier {
    func body(content: Content) -> some View {
        content.rotation3DEffect(.degrees(0), axis: (x: 0, y: 0, z: 0))
    }
}
