import Foundation

enum APIError: LocalizedError {
    case invalidURL
    /// Structured error body from `{ "error": { "code", "message", "retryable", "request_id" } }`.
    case structured(statusCode: Int, code: String?, message: String, retryable: Bool, requestId: String?)
    case status(code: Int, body: String?)
    case decoding(Error)
    case notImplemented(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL: "Invalid URL"
        case let .structured(_, _, message, _, _): message
        case let .status(code, body): "HTTP \(code): \(body ?? "")"
        case let .decoding(err): "Decoding failed: \(err.localizedDescription)"
        case let .notImplemented(msg): msg
        }
    }

    /// TestFlight-friendly lines for expandable error details (endpoint + HTTP metadata).
    func qaDetailLines(endpoint: String) -> String {
        var lines = [endpoint.trimmingCharacters(in: .whitespacesAndNewlines)]
        switch self {
        case .invalidURL:
            lines.append("code=invalid_url")
        case let .structured(statusCode, code, _, _, requestId):
            lines.append("status=\(statusCode)")
            if let code, !code.isEmpty { lines.append("code=\(code)") }
            if let requestId, !requestId.isEmpty { lines.append("requestId=\(requestId)") }
        case let .status(code, _):
            lines.append("status=\(code)")
        case let .decoding(err):
            lines.append("code=decoding_error")
            lines.append("detail=\(err.localizedDescription)")
        case let .notImplemented(msg):
            lines.append("code=not_implemented")
            lines.append("detail=\(msg)")
        }
        return lines.joined(separator: "\n")
    }
}

/// Thrown when a labeled operator API step fails (Today dashboard bundle, etc.).
struct LabeledAPIFailure: Error {
    let endpoint: String
    let underlying: Error

    var qaDetail: String {
        if let api = underlying as? APIError {
            return api.qaDetailLines(endpoint: endpoint)
        }
        return "\(endpoint)\ndetail=\(underlying.localizedDescription)"
    }
}
