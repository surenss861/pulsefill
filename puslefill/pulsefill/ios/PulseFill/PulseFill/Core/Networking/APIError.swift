import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case status(code: Int, body: String?)
    case decoding(Error)
    case notImplemented(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL: "Invalid URL"
        case let .status(code, body): "HTTP \(code): \(body ?? "")"
        case let .decoding(err): "Decoding failed: \(err.localizedDescription)"
        case let .notImplemented(msg): msg
        }
    }
}
