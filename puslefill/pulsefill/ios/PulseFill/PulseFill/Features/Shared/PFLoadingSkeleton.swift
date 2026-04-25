import SwiftUI

struct PFLoadingSkeleton: View {
    var count: Int = 4
    @State private var phase: CGFloat = -1

    var body: some View {
        VStack(spacing: 12) {
            ForEach(0..<count, id: \.self) { _ in
                RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                    .fill(Color.white.opacity(0.06))
                    .frame(height: 96)
                    .overlay(shine.mask(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)))
            }
        }
        .onAppear {
            withAnimation(.linear(duration: 1.15).repeatForever(autoreverses: false)) {
                phase = 1.2
            }
        }
    }

    private var shine: some View {
        GeometryReader { geo in
            LinearGradient(
                colors: [Color.clear, Color.white.opacity(0.18), Color.clear],
                startPoint: .top,
                endPoint: .bottom
            )
            .rotationEffect(.degrees(20))
            .frame(width: geo.size.width * 0.35)
            .offset(x: geo.size.width * phase)
        }
    }
}
