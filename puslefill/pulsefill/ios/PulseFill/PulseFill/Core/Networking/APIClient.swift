import Foundation

/// Non-2xx from `POST /v1/auth/session/sync` — carries HTTP metadata for TestFlight QA (no secrets).
enum AuthSessionSyncHTTPFailure: Error, Equatable {
    case nonSuccess(statusCode: Int, body: String?, requestId: String?)
}

@MainActor
final class APIClient {
    private let baseURL: URL
    private weak var sessionStore: SessionStore?
    private let urlSession: URLSession

    init(baseURL: URL, sessionStore: SessionStore, urlSession: URLSession = .shared) {
        self.baseURL = baseURL
        self.sessionStore = sessionStore
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
        guard let url = URL(string: rel, relativeTo: baseURL)?.absoluteURL else { throw APIError.invalidURL }
        return url
    }

    func get<T: Decodable>(_ path: String, as type: T.Type) async throws -> T {
        let url = try makeURL(path: path)
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        if let token = sessionStore?.accessToken, !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let (data, response) = try await urlSession.data(for: request)
        try throwIfNeeded(data: data, response: response)
        return try jsonDecoder.decode(T.self, from: data)
    }

    func post<T: Decodable, B: Encodable>(_ path: String, body: B, as type: T.Type) async throws -> T {
        let url = try makeURL(path: path)
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = sessionStore?.accessToken, !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = try jsonEncoder.encode(body)
        let (data, response) = try await urlSession.data(for: request)
        try throwIfNeeded(data: data, response: response)
        return try jsonDecoder.decode(T.self, from: data)
    }

    func patch<T: Decodable, B: Encodable>(_ path: String, body: B, as type: T.Type) async throws -> T {
        let url = try makeURL(path: path)
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = sessionStore?.accessToken, !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = try jsonEncoder.encode(body)
        let (data, response) = try await urlSession.data(for: request)
        try throwIfNeeded(data: data, response: response)
        return try jsonDecoder.decode(T.self, from: data)
    }

    func delete(_ path: String) async throws {
        let url = try makeURL(path: path)
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        if let token = sessionStore?.accessToken, !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let (data, response) = try await urlSession.data(for: request)
        try throwIfNeeded(data: data, response: response)
    }

    /// Customer session sync after Supabase sign-in. Failures use `AuthSessionSyncHTTPFailure` so QA can show HTTP phase precisely.
    func postAuthSessionSync() async throws -> SessionSyncResponse {
        let path = "/v1/auth/session/sync"
        let url = try makeURL(path: path)
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = sessionStore?.accessToken, !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = try jsonEncoder.encode(EmptyJSON())
        let (data, response) = try await urlSession.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw AuthSessionSyncHTTPFailure.nonSuccess(statusCode: -1, body: nil, requestId: nil)
        }
        guard (200 ..< 300).contains(http.statusCode) else {
            let bodyText = String(data: data, encoding: .utf8)
            let rid = Self.extractRequestId(from: http)
            throw AuthSessionSyncHTTPFailure.nonSuccess(statusCode: http.statusCode, body: bodyText, requestId: rid)
        }
        return try jsonDecoder.decode(SessionSyncResponse.self, from: data)
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

    private func throwIfNeeded(data: Data, response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse else { throw APIError.status(code: -1, body: nil) }
        guard (200 ..< 300).contains(http.statusCode) else {
            if let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                if let err = obj["error"] as? [String: Any] {
                    let message = (err["message"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
                    let code = err["code"] as? String
                    let retryable = err["retryable"] as? Bool ?? false
                    let nestedRid = (err["request_id"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
                    let topRid = (obj["request_id"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
                    let requestId = [nestedRid, topRid].compactMap { $0 }.first { !$0.isEmpty }
                    if let message, !message.isEmpty {
                        throw APIError.structured(
                            statusCode: http.statusCode,
                            code: code,
                            message: message,
                            retryable: retryable,
                            requestId: requestId
                        )
                    }
                    if let code {
                        throw APIError.structured(
                            statusCode: http.statusCode,
                            code: code,
                            message: code,
                            retryable: retryable,
                            requestId: requestId
                        )
                    }
                }
                if let errStr = obj["error"] as? String, !errStr.isEmpty {
                    let topRid = (obj["request_id"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
                    throw APIError.structured(
                        statusCode: http.statusCode,
                        code: nil,
                        message: errStr,
                        retryable: false,
                        requestId: (topRid?.isEmpty == false) ? topRid : nil
                    )
                }
            }
            throw APIError.status(code: http.statusCode, body: String(data: data, encoding: .utf8))
        }
    }
}
