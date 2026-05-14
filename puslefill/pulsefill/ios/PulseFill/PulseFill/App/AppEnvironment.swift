import Combine
import Foundation

@MainActor
final class AppEnvironment: ObservableObject {
    /// When non-nil, client URL/key validation failed at launch — show `blockingCustomerMessage` and avoid auth bootstrap.
    @Published private(set) var clientConfigurationBlockingMessage: String?
    /// Non-secret fields for the blocking screen (TestFlight diagnostics).
    @Published private(set) var clientConfigurationDiagnostics: PulseFillClientLaunchDiagnostics?
    private var cancellables = Set<AnyCancellable>()

    let sessionStore: SessionStore
    let apiClient: APIClient
    let userRoleContext: UserRoleContext
    let authManager: AuthManager
    let customerNavigation: CustomerNavigationCoordinator
    let pushRegistrationManager: PushRegistrationManager
    let pushCoordinator: PushNotificationCoordinator

    /// Staff / Business mode API surface — operator naming, thin wrapper over `apiClient`.
    var businessOperatorAPI: BusinessOperatorAPIClient {
        BusinessOperatorAPIClient(underlying: apiClient)
    }

    /// App entry point; all URLs/keys come from `PulseFillBuildConfiguration` (local / staging / Railway).
    static let development: AppEnvironment = {
        AppEnvironment(
            apiBaseURL: PulseFillBuildConfiguration.apiBaseURL,
            supabaseURL: PulseFillBuildConfiguration.supabaseURL,
            supabaseAnonKey: PulseFillBuildConfiguration.supabaseAnonKey
        )
    }()

    init(apiBaseURL: URL, supabaseURL: URL, supabaseAnonKey: String) {
        #if DEBUG
        PulseFillBuildConfiguration.debugLogResolvedConfigurationIfNeeded()
        #endif
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
        if launchCheck.blockingCustomerMessage != nil {
            self.clientConfigurationDiagnostics = PulseFillBuildConfiguration.clientLaunchDiagnostics(
                apiBaseURL: apiBaseURL,
                supabaseURL: supabaseURL,
                supabaseAnonKey: supabaseAnonKey,
                deploymentTier: PulseFillBuildConfiguration.deploymentTier,
                safeFailureSummary: launchCheck.safeFailureSummary
            )
        } else {
            self.clientConfigurationDiagnostics = nil
        }
        self.sessionStore = sessionStore
        let api = APIClient(baseURL: apiBaseURL, sessionStore: sessionStore)
        self.apiClient = api
        let userRoleContext = UserRoleContext(apiClient: api, sessionStore: sessionStore)
        self.userRoleContext = userRoleContext
        let pushRegistrationManager = PushRegistrationManager(apiClient: api)
        self.pushRegistrationManager = pushRegistrationManager
        let authClient = SupabaseAuthClient(supabaseURL: supabaseURL, anonKey: supabaseAnonKey)
        self.authManager = AuthManager(
            authClient: authClient,
            sessionStore: sessionStore,
            apiClient: api,
            pushRegistrationManager: pushRegistrationManager,
            userRoleContext: userRoleContext
        )

        let customerNavigation = CustomerNavigationCoordinator()
        self.customerNavigation = customerNavigation

        self.pushCoordinator = PushNotificationCoordinator(
            customerNavigation: customerNavigation,
            pushRegistration: pushRegistrationManager
        )

        customerNavigation.objectWillChange
            .sink { [weak self] _ in
                self?.objectWillChange.send()
            }
            .store(in: &cancellables)

        userRoleContext.objectWillChange
            .sink { [weak self] _ in
                self?.objectWillChange.send()
            }
            .store(in: &cancellables)
    }
}
