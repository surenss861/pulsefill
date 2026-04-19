import SwiftUI

enum PFShadow {
    static func card<V: View>(_ view: V) -> some View {
        view.shadow(color: .black.opacity(0.35), radius: 16, x: 0, y: 8)
    }
}
