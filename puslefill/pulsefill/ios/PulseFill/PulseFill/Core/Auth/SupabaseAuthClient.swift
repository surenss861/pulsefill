import Foundation

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

    private var jsonDecoder: JSONDecoder {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        return d
    }

    func signInWithPassword(email: String, password: String) async throws -> AuthSessionBundle {
        try await passwordGrant(email: email, password: password)
    }

    func signUpWithPassword(email: String, password: String) async throws -> AuthSessionBundle? {
        guard let url = URL(string: "auth/v1/signup", relativeTo: supabaseURL)?.absoluteURL else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        let body = ["email": email, "password": password]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw APIError.status(code: -1, body: nil) }
        guard (200 ..< 300).contains(http.statusCode) else {
            throw APIError.status(code: http.statusCode, body: String(data: data, encoding: .utf8))
        }
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
        guard (200 ..< 300).contains(http.statusCode) else {
            throw APIError.status(code: http.statusCode, body: String(data: data, encoding: .utf8))
        }
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
        guard (200 ..< 300).contains(http.statusCode) else {
            throw APIError.status(code: http.statusCode, body: String(data: data, encoding: .utf8))
        }

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
        guard (200 ..< 300).contains(http.statusCode) else {
            throw APIError.status(code: http.statusCode, body: String(data: data, encoding: .utf8))
        }

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
