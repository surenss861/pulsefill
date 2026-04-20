import Foundation

enum APIError: LocalizedError {
    case invalidURL
    /// Structured error body from `{ "error": { "code", "message", "retryable" } }`.
    case structured(statusCode: Int, code: String?, message: String, retryable: Bool)
    case status(code: Int, body: String?)
    case decoding(Error)
    case notImplemented(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL: "Invalid URL"
        case let .structured(_, _, message, _): message
        case let .status(code, body): "HTTP \(code): \(body ?? "")"
        case let .decoding(err): "Decoding failed: \(err.localizedDescription)"
        case let .notImplemented(msg): msg
        }
    }
}
