import SwiftUI

struct PFStatusPill: View {
    enum Variant {
        case `default`
        case primary
        case danger
        case resolved
        case muted
        case success
        case warning

        fileprivate var background: Color {
            switch self {
            case .primary: return PFColor.primarySoft
            case .danger: return PFColor.error.opacity(0.14)
            case .resolved: return Color.white.opacity(0.04)
            case .muted: return Color.white.opacity(0.035)
            case .success: return PFColor.success.opacity(0.15)
            case .warning: return PFColor.warning.opacity(0.14)
            case .default: return Color.white.opacity(0.04)
            }
        }

        fileprivate var text: Color {
            switch self {
            case .primary: return PFColor.primaryText
            case .danger: return PFColor.error
            case .resolved: return PFColor.textSecondary
            case .muted: return PFColor.textSecondary.opacity(0.85)
            case .success: return PFColor.success
            case .warning: return PFColor.warning
            case .default: return PFColor.textSecondary
            }
        }

        fileprivate var border: Color {
            switch self {
            case .primary: return PFColor.primaryBorder
            case .danger: return PFColor.error.opacity(0.35)
            case .success: return PFColor.success.opacity(0.35)
            case .warning: return PFColor.warning.opacity(0.35)
            default: return Color.white.opacity(0.10)
            }
        }
    }

    let text: String
    var variant: Variant = .default
    var uppercase = false

    var body: some View {
        Text(uppercase ? text.uppercased() : text)
            .font(.system(size: 11, weight: .semibold))
            .kerning(uppercase ? 0.6 : 0)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(variant.background)
            .foregroundStyle(variant.text)
            .clipShape(Capsule())
            .overlay(Capsule().stroke(variant.border, lineWidth: 1))
    }
}
