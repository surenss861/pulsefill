import Foundation

/// Result of synchronous submit-time validation (before any network).
enum AuthFormSubmitValidationResult: Equatable {
    case ok
    /// `qaReason` is a stable token for non-secret logging only (e.g. `empty_password`).
    case failure(banner: AuthFormBanner, qaReason: String)
}

/// Local email/password checks for Sign in / Create account — must run **before** any Supabase or API call.
enum AuthFormValidation {
    static func submitValidation(email trimmedEmail: String, password: String, mode: AuthFormMode) -> AuthFormSubmitValidationResult {
        if trimmedEmail.isEmpty {
            return .failure(banner: .validation("Enter your email."), qaReason: "empty_email")
        }
        if !isValidSingleEmailFormat(trimmedEmail) {
            return .failure(banner: .validation("Enter a valid email address."), qaReason: "invalid_email")
        }
        let pwTrim = password.trimmingCharacters(in: .whitespacesAndNewlines)
        if pwTrim.isEmpty {
            return .failure(banner: .validation("Enter your password."), qaReason: "empty_password")
        }
        if mode == .signUp, pwTrim.count < 6 {
            return .failure(banner: .validation("Use a password with at least 6 characters."), qaReason: "password_short")
        }
        return .ok
    }

    /// Defense-in-depth for `AuthManager` — same rules as `submitValidation`.
    static func localFormBannerIfInvalid(email trimmedEmail: String, password: String, mode: AuthFormMode) -> AuthFormBanner? {
        switch submitValidation(email: trimmedEmail, password: password, mode: mode) {
        case .ok:
            return nil
        case .failure(let banner, _):
            return banner
        }
    }

    /// Returns a customer-facing banner when input should block submit, otherwise `nil` (legacy call sites).
    static func localBannerIfInvalid(email trimmedEmail: String, password: String, mode: AuthFormMode) -> String? {
        localFormBannerIfInvalid(email: trimmedEmail, password: password, mode: mode)?.message
    }

    /// Exactly one `@`, non-empty local + domain, domain contains a dot (rejects `a@b`, `x@@y.com`).
    static func isValidSingleEmailFormat(_ email: String) -> Bool {
        guard email.filter({ $0 == "@" }).count == 1 else { return false }
        let parts = email.split(separator: "@", maxSplits: 1, omittingEmptySubsequences: false)
        guard parts.count == 2 else { return false }
        let local = String(parts[0])
        let domain = String(parts[1])
        guard !local.isEmpty, !domain.isEmpty else { return false }
        guard domain.contains(".") else { return false }
        return true
    }
}
