import Combine
import Foundation

@MainActor
final class AppEnvironment: ObservableObject {
    let sessionStore: SessionStore
    let apiClient: APIClient
    let authManager: AuthManager
    let customerNavigation: CustomerNavigationCoordinator
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
        let pushRegistrationManager = PushRegistrationManager(apiClient: api)
        self.pushRegistrationManager = pushRegistrationManager
        let authClient = SupabaseAuthClient(supabaseURL: supabaseURL, anonKey: supabaseAnonKey)
        self.authManager = AuthManager(
            authClient: authClient,
            sessionStore: sessionStore,
            apiClient: api,
            pushRegistrationManager: pushRegistrationManager
        )

        let customerNavigation = CustomerNavigationCoordinator()
        self.customerNavigation = customerNavigation
        self.pushCoordinator = PushNotificationCoordinator(
            customerNavigation: customerNavigation,
            pushRegistration: pushRegistrationManager
        )
    }
}
