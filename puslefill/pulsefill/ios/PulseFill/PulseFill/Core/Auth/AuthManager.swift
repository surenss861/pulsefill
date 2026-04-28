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

    enum InviteAcceptResult {
        case success
        case failure(String)
    }

    init(
        authClient: SupabaseAuthClient,
        sessionStore: SessionStore,
        apiClient: APIClient,
        pushRegistrationManager: PushRegistrationManager
    ) {
        self.authClient = authClient
        self.sessionStore = sessionStore
        self.apiClient = apiClient
        self.pushRegistrationManager = pushRegistrationManager
    }

    func restoreSessionIfNeeded() async {
        guard let token = sessionStore.accessToken, !token.isEmpty else { return }
        isBusy = true
        defer { isBusy = false }
        do {
            let bundle = try await authClient.fetchUserIfSessionValid(accessToken: token)
            sessionStore.applySession(
                accessToken: bundle.accessToken,
                refreshToken: sessionStore.refreshToken ?? bundle.refreshToken,
                userId: bundle.userId,
                email: bundle.email
            )
            try await syncCustomerSession()
            await refreshStaffAccess()
        } catch {
            sessionStore.clear()
            banner = nil
        }
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
        } catch {
            banner = error.localizedDescription
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
            } else {
                banner = "Check your inbox to verify your email, then sign in."
            }
        } catch {
            banner = error.localizedDescription
        }
    }

    func signOut() async {
        await pushRegistrationManager.deactivateCurrentDeviceIfNeeded()
        sessionStore.clear()
        banner = nil
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
            sessionStore.inviteSuccessBanner = nil
            banner = error.localizedDescription
        }
    }

    /// Call when the user pastes a token while already signed in (Profile).
    func acceptInviteTokenNow(_ token: String) async -> InviteAcceptResult {
        let trimmed = token.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return .failure("Enter the invite code from your clinic.") }
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
            let message = error.localizedDescription
            banner = message
            return .failure(message)
        }
    }
}
