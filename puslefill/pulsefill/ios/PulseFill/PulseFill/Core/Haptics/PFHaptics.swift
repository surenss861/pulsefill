import UIKit

/// Shared customer-surface haptics. Call from main thread only.
enum PFHaptics {
    enum TapImpact: Equatable {
        case none
        case light
        case medium
    }

    static func fire(_ impact: TapImpact) {
        switch impact {
        case .none:
            break
        case .light:
            lightImpact()
        case .medium:
            mediumImpact()
        }
    }

    static func lightImpact() {
        let g = UIImpactFeedbackGenerator(style: .light)
        g.prepare()
        g.impactOccurred()
    }

    static func mediumImpact() {
        let g = UIImpactFeedbackGenerator(style: .medium)
        g.prepare()
        g.impactOccurred()
    }

    static func success() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }

    static func warning() {
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
    }

    static func selection() {
        UISelectionFeedbackGenerator().selectionChanged()
    }
}
