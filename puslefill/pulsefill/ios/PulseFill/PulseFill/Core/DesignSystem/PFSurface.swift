import SwiftUI

enum PFSurface {
    static let card = PFColor.surface1
}

struct PFSurfaceCard<Content: View>: View {
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .padding(PFSpacing.md)
            .background(PFColor.surface1)
            .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                    .strokeBorder(PFColor.hairline, lineWidth: 1)
            )
    }
}
