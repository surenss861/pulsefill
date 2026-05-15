import Foundation

enum AuthFormMode: String, CaseIterable, Identifiable, Sendable {
    case signIn
    case signUp

    var id: String { rawValue }

    var navigationTitle: String {
        switch self {
        case .signIn: return "Sign in"
        case .signUp: return "Create account"
        }
    }

    var eyebrow: String {
        switch self {
        case .signIn:
            return ""
        case .signUp:
            return "Using a business invite?"
        }
    }

    var title: String {
        switch self {
        case .signIn:
            return "Sign in to run today’s recovery."
        case .signUp:
            return "Create account"
        }
    }

    var subtitle: String {
        switch self {
        case .signIn:
            return "Manage openings, claims, and confirmed bookings before the day slips away."
        case .signUp:
            return "Use the same email the business used on the invite so we can connect your profile."
        }
    }

    var primaryButtonTitle: String {
        switch self {
        case .signIn: return "Sign in"
        case .signUp: return "Create account"
        }
    }

    var busyTitle: String {
        switch self {
        case .signIn: return "Signing in…"
        case .signUp: return "Creating account…"
        }
    }

    var switchPrompt: String {
        switch self {
        case .signIn: return "Need an account?"
        case .signUp: return "Already have an account?"
        }
    }

    var switchActionTitle: String {
        switch self {
        case .signIn: return "Create account"
        case .signUp: return "Sign in"
        }
    }
}
