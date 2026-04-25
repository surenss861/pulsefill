import SwiftUI

struct StatusChipView: View {
    private enum Mode {
        case text(String, tone: Tone)
        case status(String)
    }

    private let mode: Mode

    enum Tone {
        case neutral, success, warning, danger
    }

    init(text: String, tone: Tone = .neutral) {
        mode = .text(text, tone: tone)
    }

    /// Slot / offer status keyword (e.g. `booked`, `sent`) for consistent colors.
    init(status: String) {
        mode = .status(status)
    }

    var body: some View {
        PFStatusPill(
            text: displayText,
            variant: variant,
            uppercase: false
        )
    }

    private var displayText: String {
        switch mode {
        case let .text(t, _):
            return t
        case let .status(s):
            return s.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }

    private var normalizedStatus: String? {
        if case let .status(s) = mode { return s.lowercased() }
        return nil
    }

    private var variant: PFStatusPill.Variant {
        if let normalizedStatus {
            switch normalizedStatus {
            case "booked": return .success
            case "claimed": return .warning
            case "offered", "sent", "delivered", "viewed": return .primary
            case "cancelled", "failed": return .danger
            case "expired": return .muted
            default: return .default
            }
        }

        switch mode {
        case let .text(_, tone):
            switch tone {
            case .neutral: return .default
            case .success: return .success
            case .warning: return .warning
            case .danger: return .danger
            }
        case .status:
            return .default
        }
    }
}
