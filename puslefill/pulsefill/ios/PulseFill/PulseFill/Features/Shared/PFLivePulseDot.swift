import SwiftUI

struct PFLivePulseDot: View {
    @State private var pulse = false

    var body: some View {
        ZStack {
            Circle()
                .fill(PFColor.primary.opacity(0.22))
                .frame(width: 12, height: 12)
                .scaleEffect(pulse ? 1.8 : 1.0)
                .opacity(pulse ? 0 : 0.8)
            Circle()
                .fill(PFColor.primary)
                .frame(width: 7, height: 7)
        }
        .onAppear {
            withAnimation(.easeOut(duration: 1.5).repeatForever(autoreverses: false)) {
                pulse = true
            }
        }
    }
}
