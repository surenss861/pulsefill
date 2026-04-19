import SwiftUI

extension AnyTransition {
    static var pfFadeUp: AnyTransition {
        .asymmetric(insertion: .opacity.combined(with: .offset(y: 12)), removal: .opacity)
    }
}
