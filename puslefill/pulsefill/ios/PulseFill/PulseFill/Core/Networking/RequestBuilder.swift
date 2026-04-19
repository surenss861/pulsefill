import Foundation

enum RequestBuilder {
    static func jsonRequest(url: URL, method: String, token: String?, body: Data? = nil) -> URLRequest {
        var r = URLRequest(url: url)
        r.httpMethod = method
        r.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token {
            r.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        r.httpBody = body
        return r
    }
}
