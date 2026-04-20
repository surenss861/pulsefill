import Foundation

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

    private func throwIfNeeded(data: Data, response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse else { throw APIError.status(code: -1, body: nil) }
        guard (200 ..< 300).contains(http.statusCode) else {
            if let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                if let err = obj["error"] as? [String: Any] {
                    let message = (err["message"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
                    let code = err["code"] as? String
                    let retryable = err["retryable"] as? Bool ?? false
                    if let message, !message.isEmpty {
                        throw APIError.structured(
                            statusCode: http.statusCode,
                            code: code,
                            message: message,
                            retryable: retryable
                        )
                    }
                    if let code {
                        throw APIError.structured(
                            statusCode: http.statusCode,
                            code: code,
                            message: code,
                            retryable: retryable
                        )
                    }
                }
                if let errStr = obj["error"] as? String, !errStr.isEmpty {
                    throw APIError.structured(
                        statusCode: http.statusCode,
                        code: nil,
                        message: errStr,
                        retryable: false
                    )
                }
            }
            throw APIError.status(code: http.statusCode, body: String(data: data, encoding: .utf8))
        }
    }
}
