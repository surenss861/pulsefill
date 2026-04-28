import Combine
import Foundation

@MainActor
final class SessionStore: ObservableObject {
    private enum Keys {
        static let access = "pf.accessToken"
        static let refresh = "pf.refreshToken"
        static let userId = "pf.userId"
        static let email = "pf.email"
        static let pendingInviteToken = "pf.pendingInviteToken"
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

    /// Set after `GET /v1/businesses/mine` succeeds (staff JWT) or fails (customer-only).
    @Published var isStaffUser: Bool = false

    /// Shown after a successful `POST /v1/customers/invites/accept` (cleared in UI when dismissed or after a delay).
    @Published var inviteSuccessBanner: String?

    /// Incremented so `RootTabView` can re-run the standby onboarding gate after invite accept.
    @Published var standbyOnboardingRecheck: Int = 0

    var pendingInviteToken: String? {
        get { UserDefaults.standard.string(forKey: Keys.pendingInviteToken) }
        set {
            if let v = newValue, !v.isEmpty {
                UserDefaults.standard.set(v, forKey: Keys.pendingInviteToken)
            } else {
                UserDefaults.standard.removeObject(forKey: Keys.pendingInviteToken)
            }
        }
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
        isStaffUser = false
        inviteSuccessBanner = nil
        pendingInviteToken = nil
    }
}
