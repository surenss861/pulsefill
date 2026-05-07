import Combine
import Foundation

enum RoleResolutionFallbackKind {
    case lookupFailed
    case noRoles
}

/// Resolves whether the signed-in user should see **Customer** vs **Business** surfaces, including dual-role pick.
@MainActor
final class UserRoleContext: ObservableObject {
    private enum Keys {
        static let surfaceChoice = "pf.app.surfaceChoice"
        static let preferCustomerTabs = "pf.preferCustomerTabs"
    }

    private let apiClient: APIClient
    private let sessionStore: SessionStore

    @Published private(set) var authMe: PulseFillAuthMeResponse?
    @Published private(set) var isLoading = false

    /// `true` after the first `/v1/auth/me` attempt finishes for the current signed-in session (success or failure).
    @Published private(set) var hasCompletedRoleResolution = false

    /// `customer` | `business` — empty until the user chooses (dual-role) or migration runs.
    @Published private(set) var surfaceChoice: String = UserDefaults.standard.string(forKey: Keys.surfaceChoice) ?? ""

    init(apiClient: APIClient, sessionStore: SessionStore) {
        self.apiClient = apiClient
        self.sessionStore = sessionStore
    }

    var needsRolePicker: Bool {
        guard let m = authMe, m.roles.customer, m.roles.staff else { return false }
        return surfaceChoice.isEmpty
    }

    /// Business shell: staff acting as business (`surfaceChoice` / legacy toggle), including staff-only accounts (default business when `surfaceChoice` is empty).
    var shouldShowBusinessShell: Bool {
        guard let m = authMe else { return sessionStore.isStaffUser && !isCustomerPreferredSurface }
        if m.roles.staff, !m.roles.customer { return surfaceChoice != "customer" }
        if m.roles.staff, m.roles.customer {
            return surfaceChoice == "business"
        }
        return false
    }

    private var isCustomerPreferredSurface: Bool {
        if surfaceChoice == "customer" { return true }
        if surfaceChoice.isEmpty, !sessionStore.isStaffUser { return true }
        return false
    }

    /// Signed in, role fetch finished, and we cannot route (API failure or neither role).
    var needsRoleResolutionFallback: Bool {
        guard sessionStore.isSignedIn, hasCompletedRoleResolution else { return false }
        guard let m = authMe else { return true }
        return !m.roles.customer && !m.roles.staff
    }

    var roleResolutionFallbackKind: RoleResolutionFallbackKind {
        if authMe == nil { return .lookupFailed }
        return .noRoles
    }

    /// - Parameter legacyMigrationHint: `true` when restoring a stored session (cold start); maps `preferCustomerTabs` into `surfaceChoice` when empty. `false` for fresh sign-in so dual-role users see the picker.
    func refreshFromServer(legacyMigrationHint: Bool = false) async {
        guard sessionStore.isSignedIn else {
            authMe = nil
            hasCompletedRoleResolution = false
            return
        }
        isLoading = true
        defer {
            isLoading = false
            hasCompletedRoleResolution = true
        }
        do {
            let me = try await apiClient.get("/v1/auth/me", as: PulseFillAuthMeResponse.self)
            authMe = me
            sessionStore.isStaffUser = me.roles.staff
            applySurfaceMigrationIfNeeded(legacyMigrationHint: legacyMigrationHint)
        } catch {
            authMe = nil
        }
    }

    func chooseCustomerMode() {
        chooseSurface("customer")
    }

    func chooseBusinessMode() {
        chooseSurface("business")
    }

    func resetForSignOut() {
        authMe = nil
        surfaceChoice = ""
        hasCompletedRoleResolution = false
        UserDefaults.standard.removeObject(forKey: Keys.surfaceChoice)
    }

    private func chooseSurface(_ raw: String) {
        surfaceChoice = raw
        UserDefaults.standard.set(raw, forKey: Keys.surfaceChoice)
        UserDefaults.standard.set(raw == "customer", forKey: Keys.preferCustomerTabs)
    }

    /// Returning sessions: restore prior customer vs business shell from `preferCustomerTabs` when `surfaceChoice` has never been set.
    private func applySurfaceMigrationIfNeeded(legacyMigrationHint: Bool) {
        guard legacyMigrationHint else { return }
        guard let m = authMe else { return }
        guard surfaceChoice.isEmpty else { return }
        let preferCustomer = UserDefaults.standard.bool(forKey: Keys.preferCustomerTabs)
        if m.roles.customer, m.roles.staff {
            chooseSurface(preferCustomer ? "customer" : "business")
        } else if m.roles.staff, !m.roles.customer, preferCustomer {
            chooseSurface("customer")
        }
    }
}
