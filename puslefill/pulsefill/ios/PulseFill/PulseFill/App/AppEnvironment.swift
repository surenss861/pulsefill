import Combine
import Foundation

@MainActor
final class AppEnvironment: ObservableObject {
    let sessionStore: SessionStore
    let apiClient: APIClient
    let authManager: AuthManager
    let navigationRouter: AppFlowRouter
    let pushRegistrationManager: PushRegistrationManager
    let pushCoordinator: PushNotificationCoordinator

    /// App entry point; all URLs/keys come from `PulseFillBuildConfiguration` (local / staging / Railway).
    static let development: AppEnvironment = {
        AppEnvironment(
            apiBaseURL: PulseFillBuildConfiguration.apiBaseURL,
            supabaseURL: PulseFillBuildConfiguration.supabaseURL,
            supabaseAnonKey: PulseFillBuildConfiguration.supabaseAnonKey
        )
    }()

    init(apiBaseURL: URL, supabaseURL: URL, supabaseAnonKey: String) {
        let sessionStore = SessionStore()
        self.sessionStore = sessionStore
        let api = APIClient(baseURL: apiBaseURL, sessionStore: sessionStore)
        self.apiClient = api
        let authClient = SupabaseAuthClient(supabaseURL: supabaseURL, anonKey: supabaseAnonKey)
        self.authManager = AuthManager(authClient: authClient, sessionStore: sessionStore, apiClient: api)

        let navigationRouter = AppFlowRouter()
        self.navigationRouter = navigationRouter
        let pushRegistrationManager = PushRegistrationManager(apiClient: api)
        self.pushRegistrationManager = pushRegistrationManager
        self.pushCoordinator = PushNotificationCoordinator(
            router: navigationRouter,
            pushRegistration: pushRegistrationManager
        )
    }
}
