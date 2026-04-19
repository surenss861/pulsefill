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
        Text(displayText)
            .font(.system(size: 12, weight: .semibold))
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(background)
            .foregroundStyle(foreground)
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(borderColor, lineWidth: 1)
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

    private var background: Color {
        if let normalizedStatus {
            switch normalizedStatus {
            case "booked": return PFColor.success.opacity(0.15)
            case "claimed": return Color.orange.opacity(0.18)
            case "offered", "sent", "delivered", "viewed": return Color.blue.opacity(0.18)
            case "cancelled", "failed": return PFColor.error.opacity(0.15)
            case "expired": return Color.white.opacity(0.06)
            default: return PFColor.surface2
            }
        }
        switch mode {
        case let .text(_, tone):
            switch tone {
            case .neutral: return PFColor.surface2
            case .success: return PFColor.success.opacity(0.2)
            case .warning: return PFColor.warning.opacity(0.2)
            case .danger: return PFColor.error.opacity(0.2)
            }
        case .status:
            return PFColor.surface2
        }
    }

    private var foreground: Color {
        if let normalizedStatus {
            switch normalizedStatus {
            case "booked": return PFColor.success
            case "claimed": return Color.orange
            case "offered", "sent", "delivered", "viewed": return Color.blue
            case "cancelled", "failed": return PFColor.error
            case "expired": return PFColor.textSecondary
            default: return PFColor.textSecondary
            }
        }
        switch mode {
        case let .text(_, tone):
            switch tone {
            case .neutral: return PFColor.textSecondary
            case .success: return PFColor.success
            case .warning: return PFColor.warning
            case .danger: return PFColor.error
            }
        case .status:
            return PFColor.textSecondary
        }
    }

    private var borderColor: Color {
        if let normalizedStatus {
            switch normalizedStatus {
            case "booked": return PFColor.success.opacity(0.3)
            case "claimed": return Color.orange.opacity(0.3)
            case "offered", "sent", "delivered", "viewed": return Color.blue.opacity(0.3)
            case "cancelled", "failed": return PFColor.error.opacity(0.3)
            default: return Color.white.opacity(0.08)
            }
        }
        return Color.white.opacity(0.08)
    }
}
