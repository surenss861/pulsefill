import Combine
import Foundation

@MainActor
final class AuthManager: ObservableObject {
    @Published private(set) var isBusy = false
    @Published var banner: String?

    private let authClient: SupabaseAuthClient
    private let sessionStore: SessionStore
    private let apiClient: APIClient
    private let pushRegistrationManager: PushRegistrationManager
    private let userRoleContext: UserRoleContext

    enum InviteAcceptResult {
        case success
        case failure(String)
    }

    init(
        authClient: SupabaseAuthClient,
        sessionStore: SessionStore,
        apiClient: APIClient,
        pushRegistrationManager: PushRegistrationManager,
        userRoleContext: UserRoleContext
    ) {
        self.authClient = authClient
        self.sessionStore = sessionStore
        self.apiClient = apiClient
        self.pushRegistrationManager = pushRegistrationManager
        self.userRoleContext = userRoleContext
    }

    func restoreSessionIfNeeded() async {
        let accessToken = sessionStore.accessToken?.nilIfEmpty
        let refreshToken = sessionStore.refreshToken?.nilIfEmpty
        guard accessToken != nil || refreshToken != nil else { return }
        isBusy = true
        defer { isBusy = false }
        do {
            let bundle = try await restoreSessionBundle(accessToken: accessToken, refreshToken: refreshToken)
            sessionStore.applySession(
                accessToken: bundle.accessToken,
                refreshToken: bundle.refreshToken ?? refreshToken,
                userId: bundle.userId,
                email: bundle.email
            )
            try await syncCustomerSession()
            await refreshStaffAccess()
            await userRoleContext.refreshFromServer(legacyMigrationHint: true)
        } catch {
            #if DEBUG
            print("AuthManager.restoreSessionIfNeeded error: \(error)")
            #endif
            sessionStore.clear()
            userRoleContext.resetForSignOut()
            banner = nil
        }
    }

    private func restoreSessionBundle(accessToken: String?, refreshToken: String?) async throws -> AuthSessionBundle {
        if let accessToken {
            do {
                return try await authClient.fetchUserIfSessionValid(accessToken: accessToken)
            } catch {
                guard let refreshToken else { throw error }
                return try await authClient.refreshSession(refreshToken: refreshToken)
            }
        }

        guard let refreshToken else { throw APIError.status(code: 401, body: nil) }
        return try await authClient.refreshSession(refreshToken: refreshToken)
    }

    func signIn(email: String, password: String) async {
        banner = nil
        isBusy = true
        defer { isBusy = false }
        do {
            let bundle = try await authClient.signInWithPassword(email: email, password: password)
            sessionStore.applySession(
                accessToken: bundle.accessToken,
                refreshToken: bundle.refreshToken,
                userId: bundle.userId,
                email: bundle.email
            )
            try await syncCustomerSession()
            await refreshStaffAccess()
            await userRoleContext.refreshFromServer(legacyMigrationHint: false)
        } catch {
            #if DEBUG
            print("AuthManager.signIn error: \(error)")
            #endif
            banner = PFCustomerFacingErrorCopy.sanitizeAuthMessage(error.localizedDescription)
        }
    }

    func signUp(email: String, password: String) async {
        banner = nil
        isBusy = true
        defer { isBusy = false }
        do {
            if let bundle = try await authClient.signUpWithPassword(email: email, password: password) {
                sessionStore.applySession(
                    accessToken: bundle.accessToken,
                    refreshToken: bundle.refreshToken,
                    userId: bundle.userId,
                    email: bundle.email
                )
                try await syncCustomerSession()
                await refreshStaffAccess()
                await userRoleContext.refreshFromServer(legacyMigrationHint: false)
            } else {
                banner = "Check your inbox to verify your email, then sign in."
            }
        } catch {
            #if DEBUG
            print("AuthManager.signUp error: \(error)")
            #endif
            banner = PFCustomerFacingErrorCopy.sanitizeAuthMessage(error.localizedDescription)
        }
    }

    func signOut() async {
        await pushRegistrationManager.deactivateCurrentDeviceIfNeeded()
        sessionStore.clear()
        userRoleContext.resetForSignOut()
        banner = nil
    }

    /// Password reset email via Supabase Auth (`/auth/v1/recover`). Errors are customer-sanitized on `banner`.
    func requestPasswordReset(email: String) async {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            banner = "Enter the email you use with PulseFill."
            return
        }
        banner = nil
        isBusy = true
        defer { isBusy = false }
        do {
            try await authClient.requestPasswordRecovery(email: trimmed)
            banner = "If we find an account for that email, we’ll send reset instructions."
        } catch {
            #if DEBUG
            print("AuthManager.requestPasswordReset error: \(error)")
            #endif
            banner = PFCustomerFacingErrorCopy.sanitizeAuthMessage(error.localizedDescription)
        }
    }

    /// Call after sign-in / restore to detect staff JWT (`GET /v1/businesses/mine`).
    func refreshStaffAccess() async {
        guard sessionStore.isSignedIn else {
            sessionStore.isStaffUser = false
            return
        }
        do {
            _ = try await apiClient.get("/v1/businesses/mine", as: Business.self)
            sessionStore.isStaffUser = true
        } catch {
            sessionStore.isStaffUser = false
        }
    }

    private func syncCustomerSession() async throws {
        _ = try await apiClient.post("/v1/auth/session/sync", body: EmptyJSON(), as: SessionSyncResponse.self)
        await acceptPendingInviteIfNeeded()
    }

    /// Consumes `sessionStore.pendingInviteToken` (from deep link) after session sync. Failures do not block sign-in; the customer can accept from Profile.
    /// Call after a deep link stores a token; no-op if not signed in (token is consumed on next sign-in sync).
    func processPendingInviteTokenIfNeeded() async {
        await acceptPendingInviteIfNeeded()
    }

    private func acceptPendingInviteIfNeeded() async {
        guard let raw = sessionStore.pendingInviteToken?.trimmingCharacters(in: .whitespacesAndNewlines), !raw.isEmpty else {
            return
        }
        guard sessionStore.isSignedIn else { return }
        do {
            let res = try await apiClient.acceptCustomerInvite(token: raw)
            sessionStore.pendingInviteToken = nil
            sessionStore.inviteSuccessBanner =
                "Invite accepted. Set your standby preferences so we know which openings to send."
            if res.needsStandbySetup {
                sessionStore.standbyOnboardingRecheck += 1
            }
        } catch {
            #if DEBUG
            print("AuthManager.acceptPendingInviteIfNeeded error: \(error)")
            #endif
            sessionStore.inviteSuccessBanner = nil
            banner = PFCustomerFacingErrorCopy.sanitizeAuthMessage(error.localizedDescription)
        }
    }

    /// Call when the user pastes a token while already signed in (Profile).
    func acceptInviteTokenNow(_ token: String) async -> InviteAcceptResult {
        let trimmed = token.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return .failure("Enter the invite code from the business.") }
        banner = nil
        isBusy = true
        defer { isBusy = false }
        do {
            let res = try await apiClient.acceptCustomerInvite(token: trimmed)
            sessionStore.inviteSuccessBanner =
                "Invite accepted. Set your standby preferences so we know which openings to send."
            if res.needsStandbySetup {
                sessionStore.standbyOnboardingRecheck += 1
            }
            return .success
        } catch {
            #if DEBUG
            print("AuthManager.acceptInviteTokenNow error: \(error)")
            #endif
            let message = PFCustomerFacingErrorCopy.sanitizeAuthMessage(error.localizedDescription)
            banner = message
            return .failure(message)
        }
    }
}

private extension String {
    var nilIfEmpty: String? {
        let trimmed = trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
