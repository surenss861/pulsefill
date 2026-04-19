import Combine
import Foundation

@MainActor
final class AuthManager: ObservableObject {
    @Published private(set) var isBusy = false
    @Published var banner: String?

    private let authClient: SupabaseAuthClient
    private let sessionStore: SessionStore
    private let apiClient: APIClient

    init(authClient: SupabaseAuthClient, sessionStore: SessionStore, apiClient: APIClient) {
        self.authClient = authClient
        self.sessionStore = sessionStore
        self.apiClient = apiClient
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
            } else {
                banner = "Check your inbox to verify your email, then sign in."
            }
        } catch {
            banner = error.localizedDescription
        }
    }

    func signOut() async {
        sessionStore.clear()
        banner = nil
    }

    private func syncCustomerSession() async throws {
        _ = try await apiClient.post("/v1/auth/session/sync", body: EmptyJSON(), as: SessionSyncResponse.self)
    }
}
