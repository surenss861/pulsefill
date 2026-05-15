import Foundation

/// Thrown by `SupabaseAuthClient` before any HTTP when credentials are unusable (defense-in-depth vs UI bugs).
enum SupabaseAuthClientValidationError: Error, Equatable {
    case emptyEmail
    case invalidEmail
    case emptyPassword
    case passwordTooShortForSignUp
}

/// Supabase Auth over HTTPS (password grant) so the app builds without the Swift SDK.
/// Add `https://github.com/supabase/supabase-swift` later if you want richer session APIs.
struct AuthSessionBundle {
    let accessToken: String
    let refreshToken: String?
    let userId: String
    let email: String?
}

struct SupabaseAuthClient {
    let supabaseURL: URL
    let anonKey: String

    /// Non-2xx from Supabase Auth — preserves existing error surface; DEBUG logs a hint when the host is wrong (HTML 404).
    private func throwIfAuthHTTPFailed(http: HTTPURLResponse, data: Data) throws {
        guard (200 ..< 300).contains(http.statusCode) else {
            #if DEBUG
            logMisconfiguredSupabaseURLHintIfNeeded(statusCode: http.statusCode, responseBody: data)
            #endif
            throw APIError.status(code: http.statusCode, body: String(data: data, encoding: .utf8))
        }
    }

    #if DEBUG
    /// Wrong `PULSEFILL_SUPABASE_URL` (e.g. dashboard/web host) yields `/auth/v1/*` → site 404 HTML instead of Supabase JSON.
    private func logMisconfiguredSupabaseURLHintIfNeeded(statusCode: Int, responseBody: Data?) {
        guard statusCode == 404 else { return }
        let text = String(data: responseBody ?? Data(), encoding: .utf8) ?? ""
        let normalized = text.lowercased()
        let looksLikeHTML404 =
            normalized.contains("<!doctype html") ||
            normalized.contains("<html") ||
            normalized.contains("page not found") ||
            normalized.contains("that route does not exist")
        guard looksLikeHTML404 else { return }
        print(
            "PulseFill: Supabase Auth returned an HTML 404. Check PULSEFILL_SUPABASE_URL — it must be your Supabase project URL (https://<project-ref>.supabase.co), not the PulseFill web/dashboard host."
        )
    }
    #endif

    private var jsonDecoder: JSONDecoder {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        return d
    }

    private func validateCredentialInputs(email: String, password: String, mode: AuthFormMode) throws {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let pw = password.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmedEmail.isEmpty { throw SupabaseAuthClientValidationError.emptyEmail }
        if !AuthFormValidation.isValidSingleEmailFormat(trimmedEmail) { throw SupabaseAuthClientValidationError.invalidEmail }
        if pw.isEmpty { throw SupabaseAuthClientValidationError.emptyPassword }
        if mode == .signUp, pw.count < 6 { throw SupabaseAuthClientValidationError.passwordTooShortForSignUp }
    }

    private func validateRecoveryEmail(_ email: String) throws {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { throw SupabaseAuthClientValidationError.emptyEmail }
        if !AuthFormValidation.isValidSingleEmailFormat(trimmed) { throw SupabaseAuthClientValidationError.invalidEmail }
    }

    func signInWithPassword(email: String, password: String) async throws -> AuthSessionBundle {
        try validateCredentialInputs(email: email, password: password, mode: .signIn)
        return try await passwordGrant(email: email, password: password)
    }

    /// Sends Supabase’s password-recovery email (same as `resetPasswordForEmail` in the JS client).
    func requestPasswordRecovery(email: String) async throws {
        try validateRecoveryEmail(email)
        guard let url = URL(string: "auth/v1/recover", relativeTo: supabaseURL)?.absoluteURL else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        let body = ["email": email]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw APIError.status(code: -1, body: nil) }
        try throwIfAuthHTTPFailed(http: http, data: data)
    }

    func signUpWithPassword(email: String, password: String) async throws -> AuthSessionBundle? {
        try validateCredentialInputs(email: email, password: password, mode: .signUp)
        guard let url = URL(string: "auth/v1/signup", relativeTo: supabaseURL)?.absoluteURL else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        let body: [String: Any] = [
            "email": email,
            "password": password,
            "data": [
                "signup_intent": "customer",
            ],
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw APIError.status(code: -1, body: nil) }
        try throwIfAuthHTTPFailed(http: http, data: data)
        struct SignupEnvelope: Decodable {
            let session: SessionEnvelope?
        }
        struct SessionEnvelope: Decodable {
            let accessToken: String
            let refreshToken: String?
            let user: UserEnvelope
        }
        struct UserEnvelope: Decodable {
            let id: String
            let email: String?
        }
        let decoded = try jsonDecoder.decode(SignupEnvelope.self, from: data)
        guard let session = decoded.session else { return nil }
        return AuthSessionBundle(
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
            userId: session.user.id,
            email: session.user.email
        )
    }

    func fetchUserIfSessionValid(accessToken: String) async throws -> AuthSessionBundle {
        guard let url = URL(string: "auth/v1/user", relativeTo: supabaseURL)?.absoluteURL else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw APIError.status(code: -1, body: nil) }
        try throwIfAuthHTTPFailed(http: http, data: data)
        struct UserOnly: Decodable {
            let id: String
            let email: String?
        }
        let user = try jsonDecoder.decode(UserOnly.self, from: data)
        return AuthSessionBundle(accessToken: accessToken, refreshToken: nil, userId: user.id, email: user.email)
    }

    func refreshSession(refreshToken: String) async throws -> AuthSessionBundle {
        guard var components = URLComponents(
            url: URL(string: "auth/v1/token", relativeTo: supabaseURL)?.absoluteURL ?? supabaseURL,
            resolvingAgainstBaseURL: false
        ) else { throw APIError.invalidURL }
        components.queryItems = [URLQueryItem(name: "grant_type", value: "refresh_token")]
        guard let url = components.url else { throw APIError.invalidURL }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        let body = ["refresh_token": refreshToken]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw APIError.status(code: -1, body: nil) }
        try throwIfAuthHTTPFailed(http: http, data: data)

        struct TokenEnvelope: Decodable {
            let accessToken: String
            let refreshToken: String?
            let user: UserEnvelope
        }
        struct UserEnvelope: Decodable {
            let id: String
            let email: String?
        }

        let decoded = try jsonDecoder.decode(TokenEnvelope.self, from: data)
        return AuthSessionBundle(
            accessToken: decoded.accessToken,
            refreshToken: decoded.refreshToken,
            userId: decoded.user.id,
            email: decoded.user.email
        )
    }

    private func passwordGrant(email: String, password: String) async throws -> AuthSessionBundle {
        guard var components = URLComponents(
            url: URL(string: "auth/v1/token", relativeTo: supabaseURL)?.absoluteURL ?? supabaseURL,
            resolvingAgainstBaseURL: false
        ) else { throw APIError.invalidURL }
        components.queryItems = [URLQueryItem(name: "grant_type", value: "password")]
        guard let url = components.url else { throw APIError.invalidURL }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        let body = ["email": email, "password": password]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw APIError.status(code: -1, body: nil) }
        try throwIfAuthHTTPFailed(http: http, data: data)

        struct TokenEnvelope: Decodable {
            let accessToken: String
            let refreshToken: String?
            let user: UserEnvelope
        }
        struct UserEnvelope: Decodable {
            let id: String
            let email: String?
        }

        let decoded = try jsonDecoder.decode(TokenEnvelope.self, from: data)
        return AuthSessionBundle(
            accessToken: decoded.accessToken,
            refreshToken: decoded.refreshToken,
            userId: decoded.user.id,
            email: decoded.user.email
        )
    }
}

// MARK: - Test seam (production uses `SupabaseAuthClient`)

protocol PulseFillPasswordAuthClient: Sendable {
    /// When true, sign-in / sign-up already ran customer profile sync on the API (`POST /v1/mobile/auth/*`); skip `POST /v1/auth/session/sync` on the client.
    var performsServerSideSessionSync: Bool { get }
    func signInWithPassword(email: String, password: String) async throws -> AuthSessionBundle
    func signUpWithPassword(email: String, password: String) async throws -> AuthSessionBundle?
    func requestPasswordRecovery(email: String) async throws
    func fetchUserIfSessionValid(accessToken: String) async throws -> AuthSessionBundle
    func refreshSession(refreshToken: String) async throws -> AuthSessionBundle
    /// Best-effort server revocation of refresh tokens (broker only). Default: no-op.
    func signOutOnServerIfPossible(accessToken: String) async
}

extension PulseFillPasswordAuthClient {
    var performsServerSideSessionSync: Bool { false }

    func signOutOnServerIfPossible(accessToken _: String) async {}
}

extension SupabaseAuthClient: PulseFillPasswordAuthClient {
    var performsServerSideSessionSync: Bool { false }
}

extension SupabaseAuthClientValidationError {
    var authFormBanner: AuthFormBanner {
        switch self {
        case .emptyEmail:
            return .validation("Enter your email.")
        case .invalidEmail:
            return .validation("Enter a valid email address.")
        case .emptyPassword:
            return .validation("Enter your password.")
        case .passwordTooShortForSignUp:
            return .validation("Use a password with at least 6 characters.")
        }
    }
}
