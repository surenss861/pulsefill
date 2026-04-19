import Foundation

struct Endpoint {
    var path: String
    var method: String = "GET"
    var queryItems: [URLQueryItem] = []

    func url(base: URL) throws -> URL {
        let trimmed = path.hasPrefix("/") ? String(path.dropFirst()) : path
        guard let relative = URL(string: trimmed, relativeTo: base) else { throw APIError.invalidURL }
        let absolute = relative.absoluteURL
        guard var components = URLComponents(url: absolute, resolvingAgainstBaseURL: false) else {
            throw APIError.invalidURL
        }
        if !queryItems.isEmpty {
            components.queryItems = queryItems
        }
        guard let u = components.url else { throw APIError.invalidURL }
        return u
    }
}
