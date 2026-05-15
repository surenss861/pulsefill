import Foundation

/// Sign-in / sign-up form surface only — **not** read from `AuthManager` so stale global state cannot leak into the UI.
enum AuthFormBanner: Equatable {
    case validation(String)
    case info(String)
    case auth(String)
    case connection(String)

    var message: String {
        switch self {
        case .validation(let s), .info(let s), .auth(let s), .connection(let s):
            return s
        }
    }

    /// Success-style chrome (reset sent, verify inbox from happy path).
    var usesSuccessChrome: Bool {
        if case .info = self { return true }
        return false
    }

    /// Non-secret label for QA footer / logging (e.g. `validation`, `connection`).
    var qaKind: String {
        switch self {
        case .validation: return "validation"
        case .info: return "info"
        case .auth: return "auth"
        case .connection: return "connection"
        }
    }

    /// Maps sanitized sign-in / sign-up / session-sync / password-recovery errors to a semantic banner.
    static func fromSignInFlowError(_ error: Error) -> AuthFormBanner {
        let text = PFCustomerFacingErrorCopy.sanitizeSignInFlowError(error)
        if error is URLError {
            return .connection(text)
        }
        if text == "Email or password is incorrect." {
            return .auth(text)
        }
        // Normalize curly apostrophe (common in customer-facing strings) so one branch covers "couldn't" / "couldn't".
        let lower = text.lowercased().replacingOccurrences(of: "\u{2019}", with: "'")
        if lower.contains("couldn't connect")
            || lower.contains("could not connect")
            || lower.contains("try again shortly")
            || lower.contains("check your connection")
        {
            return .connection(text)
        }
        if text.hasPrefix("Check your email to verify") {
            return .info(text)
        }
        return .auth(text)
    }
}

// MARK: - Remote auth outcomes (returned to `AuthFormView`, never written to a global banner)

enum AuthFormSignInOutcome: Equatable {
    case signedIn
    case failed(AuthFormBanner)
}

enum AuthFormSignUpOutcome: Equatable {
    case signedIn
    case verifyEmailInbox
    case failed(AuthFormBanner)
}
