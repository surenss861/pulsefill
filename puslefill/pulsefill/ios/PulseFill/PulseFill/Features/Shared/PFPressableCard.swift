import SwiftUI

private struct PFPressableCardModifier: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @GestureState private var isPressed = false

    func body(content: Content) -> some View {
        content
            .scaleEffect(reduceMotion || !isPressed ? 1 : 0.98)
            .opacity(isPressed ? 0.94 : 1)
            .animation(reduceMotion ? nil : .spring(response: 0.22, dampingFraction: 0.84), value: isPressed)
            .simultaneousGesture(
                DragGesture(minimumDistance: 0)
                    .updating($isPressed) { _, state, _ in
                        state = true
                    }
            )
    }
}

extension View {
    func pfPressableCard() -> some View {
        modifier(PFPressableCardModifier())
    }
}
