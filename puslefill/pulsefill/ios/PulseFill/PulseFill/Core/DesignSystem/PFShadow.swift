import SwiftUI

enum PFShadow {
    static func card<V: View>(_ view: V) -> some View {
        view.shadow(color: PFColor.elevationShadow, radius: 16, x: 0, y: 8)
    }
}
