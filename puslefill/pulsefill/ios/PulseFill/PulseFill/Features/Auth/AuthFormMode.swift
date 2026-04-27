import Foundation

enum AuthFormMode: String, CaseIterable, Identifiable {
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
        case .signIn: return "Welcome back"
        case .signUp: return "Invite access"
        }
    }

    var title: String {
        switch self {
        case .signIn:
            return "Sign in to PulseFill."
        case .signUp:
            return "Create your account."
        }
    }

    var subtitle: String {
        switch self {
        case .signIn:
            return "View offers, claim openings, and track booking updates."
        case .signUp:
            return "Use the email tied to your invite to start receiving appointment updates."
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
        case .signIn: return "Have an invite?"
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
