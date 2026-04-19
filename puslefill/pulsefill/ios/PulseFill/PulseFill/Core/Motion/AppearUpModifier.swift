import SwiftUI

struct AppearUpModifier: ViewModifier {
    @State private var visible = false

    func body(content: Content) -> some View {
        content
            .opacity(visible ? 1 : 0)
            .offset(y: visible ? 0 : 8)
            .animation(.spring(response: 0.42, dampingFraction: 0.88), value: visible)
            .onAppear {
                visible = true
            }
    }
}

extension View {
    func appearUp() -> some View {
        modifier(AppearUpModifier())
    }
}
