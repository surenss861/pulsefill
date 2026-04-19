import Combine
import Foundation

@MainActor
final class SessionStore: ObservableObject {
    private enum Keys {
        static let access = "pf.accessToken"
        static let refresh = "pf.refreshToken"
        static let userId = "pf.userId"
        static let email = "pf.email"
    }

    @Published var accessToken: String? {
        didSet { UserDefaults.standard.set(accessToken, forKey: Keys.access) }
    }

    @Published var refreshToken: String? {
        didSet { UserDefaults.standard.set(refreshToken, forKey: Keys.refresh) }
    }

    @Published var userId: String? {
        didSet { UserDefaults.standard.set(userId, forKey: Keys.userId) }
    }

    @Published var email: String? {
        didSet { UserDefaults.standard.set(email, forKey: Keys.email) }
    }

    var isSignedIn: Bool {
        guard let accessToken, !accessToken.isEmpty else { return false }
        return true
    }

    init() {
        accessToken = UserDefaults.standard.string(forKey: Keys.access)
        refreshToken = UserDefaults.standard.string(forKey: Keys.refresh)
        userId = UserDefaults.standard.string(forKey: Keys.userId)
        email = UserDefaults.standard.string(forKey: Keys.email)
    }

    func applySession(accessToken: String, refreshToken: String?, userId: String?, email: String?) {
        self.accessToken = accessToken
        self.refreshToken = refreshToken
        self.userId = userId
        self.email = email
    }

    func clear() {
        accessToken = nil
        refreshToken = nil
        userId = nil
        email = nil
    }
}
