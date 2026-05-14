import Foundation

/// Local email/password checks for Sign in / Create account — must run **before** any Supabase or API call.
enum AuthFormValidation {
    /// Returns a customer-facing banner string when input should block submit, otherwise `nil`.
    static func localBannerIfInvalid(email trimmedEmail: String, password: String, mode: AuthFormMode) -> String? {
        if trimmedEmail.isEmpty {
            return "Enter your email."
        }
        if !isValidSingleEmailFormat(trimmedEmail) {
            return "Enter a valid email address."
        }
        let pwTrim = password.trimmingCharacters(in: .whitespacesAndNewlines)
        if pwTrim.isEmpty {
            return "Enter your password."
        }
        if mode == .signUp, pwTrim.count < 6 {
            return "Use a password with at least 6 characters."
        }
        return nil
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
