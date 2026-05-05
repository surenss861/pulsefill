import Combine
import Foundation

@MainActor
final class AppEnvironment: ObservableObject {
    /// When non-nil, client URL/key validation failed at launch — show `blockingCustomerMessage` and avoid auth bootstrap.
    @Published private(set) var clientConfigurationBlockingMessage: String?
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
        let launchCheck = PulseFillBuildConfiguration.evaluateLaunchConfiguration(
            apiBaseURL: apiBaseURL,
            supabaseURL: supabaseURL,
            supabaseAnonKey: supabaseAnonKey
        )
        #if DEBUG
        if launchCheck.blockingCustomerMessage != nil, let detail = launchCheck.debugSummary {
            print("PulseFill launch configuration issue: \(detail)")
        }
        #endif

        let sessionStore = SessionStore()
        self.clientConfigurationBlockingMessage = launchCheck.blockingCustomerMessage
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
