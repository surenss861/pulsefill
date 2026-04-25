import SwiftUI

private struct PFSuccessPulseModifier<T: Equatable>: ViewModifier {
    let trigger: T
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var active = false

    func body(content: Content) -> some View {
        content
            .overlay(
                RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                    .stroke(PFColor.primary.opacity(active ? 0.45 : 0), lineWidth: 1.5)
                    .shadow(color: PFColor.primary.opacity(active ? 0.30 : 0), radius: active ? 10 : 0)
                    .scaleEffect(reduceMotion ? 1 : (active ? 1.01 : 0.995))
                    .opacity(active ? 1 : 0)
                    .animation(reduceMotion ? .easeOut(duration: 0.18) : .easeInOut(duration: 0.35), value: active)
            )
            .overlay(alignment: .topTrailing) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(PFColor.primary)
                    .padding(10)
                    .opacity(active ? 1 : 0)
                    .scaleEffect(active ? 1 : 0.92)
                    .animation(.easeOut(duration: 0.20), value: active)
            }
            .onChange(of: trigger) { _, _ in
                active = true
                let delay = reduceMotion ? 0.20 : 0.45
                DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                    active = false
                }
            }
    }
}

extension View {
    func pfSuccessPulse<T: Equatable>(trigger: T) -> some View {
        modifier(PFSuccessPulseModifier(trigger: trigger))
    }
}
