import Foundation

/// Password and recovery auth via PulseFill API (`/v1/mobile/auth/*`). Supabase is not contacted from the device.
struct BackendMobileAuthClient {
    let apiBaseURL: URL
    let urlSession: URLSession

    init(apiBaseURL: URL, urlSession: URLSession = .shared) {
        self.apiBaseURL = apiBaseURL
        self.urlSession = urlSession
    }

    private var jsonDecoder: JSONDecoder {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        return d
    }

    private var jsonEncoder: JSONEncoder {
        let e = JSONEncoder()
        e.keyEncodingStrategy = .convertToSnakeCase
        return e
    }

    private func makeURL(path: String) throws -> URL {
        let rel = path.hasPrefix("/") ? path : "/\(path)"
        guard let url = URL(string: rel, relativeTo: apiBaseURL)?.absoluteURL else { throw APIError.invalidURL }
        return url
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

    private struct BrokerErrEnvelope: Decodable {
        struct Inner: Decodable {
            let code: String?
            let message: String?
            let retryable: Bool?
            let requestId: String?
        }

        let error: Inner
    }

    private struct SessionBlock: Decodable {
        let accessToken: String
        let refreshToken: String?
        let userId: String
        let email: String?
    }

    private struct SignInSuccess: Decodable {
        let session: SessionBlock
    }

    private struct SignUpEnvelope: Decodable {
        let needsEmailConfirmation: Bool?
        let session: SessionBlock?
    }

    private struct RefreshBody: Encodable {
        let refreshToken: String
    }

    private struct SignInBody: Encodable {
        let email: String
        let password: String
    }

    private struct SignUpBody: Encodable {
        let email: String
        let password: String
    }

    private struct PasswordResetBody: Encodable {
        let email: String
    }

    private static func extractRequestId(from http: HTTPURLResponse) -> String? {
        let keys = ["X-Request-Id", "x-request-id", "Railway-Request-Id", "CF-Ray", "fly-request-id"]
        for key in keys {
            if let v = http.value(forHTTPHeaderField: key)?.trimmingCharacters(in: .whitespacesAndNewlines), !v.isEmpty {
                return v
            }
        }
        return nil
    }

    private func throwIfFailed(data: Data, http: HTTPURLResponse) throws {
        guard (200 ..< 300).contains(http.statusCode) else {
            if let env = try? jsonDecoder.decode(BrokerErrEnvelope.self, from: data) {
                let inner = env.error
                let msg = inner.message?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty ?? inner.code ?? "Request failed."
                throw APIError.structured(
                    statusCode: http.statusCode,
                    code: inner.code,
                    message: msg,
                    retryable: inner.retryable ?? false,
                    requestId: inner.requestId?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty
                        ?? Self.extractRequestId(from: http)
                )
            }
            let rid = Self.extractRequestId(from: http)
            let bodyText = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines)
            let msg = (bodyText?.isEmpty == false) ? bodyText! : "Request failed."
            throw APIError.structured(
                statusCode: http.statusCode,
                code: nil,
                message: msg,
                retryable: (500 ..< 600).contains(http.statusCode),
                requestId: rid
            )
        }
    }

    private func dataTask(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        let (data, response) = try await urlSession.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw APIError.status(code: -1, body: nil) }
        return (data, http)
    }
}

extension BackendMobileAuthClient: PulseFillPasswordAuthClient {
    var performsServerSideSessionSync: Bool { true }

    func signInWithPassword(email: String, password: String) async throws -> AuthSessionBundle {
        try validateCredentialInputs(email: email, password: password, mode: .signIn)
        let url = try makeURL(path: "/v1/mobile/auth/sign-in")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try jsonEncoder.encode(SignInBody(email: email, password: password))
        let (data, http) = try await dataTask(request)
        try throwIfFailed(data: data, http: http)
        let decoded = try jsonDecoder.decode(SignInSuccess.self, from: data)
        let s = decoded.session
        return AuthSessionBundle(accessToken: s.accessToken, refreshToken: s.refreshToken, userId: s.userId, email: s.email)
    }

    func signUpWithPassword(email: String, password: String) async throws -> AuthSessionBundle? {
        try validateCredentialInputs(email: email, password: password, mode: .signUp)
        let url = try makeURL(path: "/v1/mobile/auth/sign-up-customer")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try jsonEncoder.encode(SignUpBody(email: email, password: password))
        let (data, http) = try await dataTask(request)
        try throwIfFailed(data: data, http: http)
        let decoded = try jsonDecoder.decode(SignUpEnvelope.self, from: data)
        if decoded.needsEmailConfirmation == true { return nil }
        guard let s = decoded.session else { return nil }
        return AuthSessionBundle(accessToken: s.accessToken, refreshToken: s.refreshToken, userId: s.userId, email: s.email)
    }

    func requestPasswordRecovery(email: String) async throws {
        try validateRecoveryEmail(email)
        let url = try makeURL(path: "/v1/mobile/auth/password-reset")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try jsonEncoder.encode(PasswordResetBody(email: email))
        let (data, http) = try await dataTask(request)
        try throwIfFailed(data: data, http: http)
    }

    func fetchUserIfSessionValid(accessToken: String) async throws -> AuthSessionBundle {
        let url = try makeURL(path: "/v1/auth/me")
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        let (data, http) = try await dataTask(request)
        try throwIfFailed(data: data, http: http)
        let me = try jsonDecoder.decode(PulseFillAuthMeResponse.self, from: data)
        return AuthSessionBundle(accessToken: accessToken, refreshToken: nil, userId: me.user.id, email: me.user.email)
    }

    func refreshSession(refreshToken: String) async throws -> AuthSessionBundle {
        let url = try makeURL(path: "/v1/mobile/auth/refresh")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try jsonEncoder.encode(RefreshBody(refreshToken: refreshToken))
        let (data, http) = try await dataTask(request)
        try throwIfFailed(data: data, http: http)
        let decoded = try jsonDecoder.decode(SignInSuccess.self, from: data)
        let s = decoded.session
        return AuthSessionBundle(accessToken: s.accessToken, refreshToken: s.refreshToken, userId: s.userId, email: s.email)
    }

    func signOutOnServerIfPossible(accessToken: String) async {
        let trimmed = accessToken.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        do {
            let url = try makeURL(path: "/v1/mobile/auth/sign-out")
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("Bearer \(trimmed)", forHTTPHeaderField: "Authorization")
            let (data, http) = try await dataTask(request)
            try throwIfFailed(data: data, http: http)
        } catch {
            // Best-effort only; local session is still cleared by `AuthManager`.
        }
    }
}

private extension String {
    var nilIfEmpty: String? {
        let t = trimmingCharacters(in: .whitespacesAndNewlines)
        return t.isEmpty ? nil : t
    }
}
