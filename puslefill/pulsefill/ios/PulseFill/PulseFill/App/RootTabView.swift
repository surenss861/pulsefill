import SwiftUI

struct RootTabView: View {
    @EnvironmentObject private var env: AppEnvironment

    @AppStorage("pf.onboarding.standby.completed") private var standbyOnboardingCompleted = false
    @AppStorage("pf.onboarding.standby.dismissed") private var standbyOnboardingDismissed = false
    @AppStorage("pf.onboarding.standby.justCompleted") private var standbyJustCompleted = false

    @State private var showStandbyOnboarding = false

    var body: some View {
        TabView(
            selection: Binding(
                get: { env.customerNavigation.selectedTab },
                set: { env.customerNavigation.selectedTab = $0 }
            )
        ) {
            HomeView()
                .tabItem { Label("Home", systemImage: "house.fill") }
                .tag(AppTab.home)

            OffersInboxView()
                .tabItem { Label("Offers", systemImage: "bell.badge.fill") }
                .tag(AppTab.offers)

            CustomerActivityFeedView(api: env.apiClient)
                .environmentObject(env)
                .tabItem { Label("Activity", systemImage: "clock.fill") }
                .tag(AppTab.activity)

            ProfileView()
                .tabItem { Label("Profile", systemImage: "person.crop.circle") }
                .tag(AppTab.profile)
        }
        .tint(PFColor.primary)
        .task(id: env.sessionStore.userId) {
            await runStandbyOnboardingGate()
        }
        .fullScreenCover(isPresented: $showStandbyOnboarding) {
            StandbyOnboardingFlowView(
                onFinish: { landing in
                    completeStandbyOnboarding(landing: landing)
                },
                onDismissed: { dismissStandbyOnboarding() }
            )
            .environmentObject(env)
        }
    }

    @MainActor
    private func migrateLegacyStandbyOnboardingKeys() {
        let legacy = UserDefaults.standard.bool(forKey: "pf.onboarding.standbyFirstRunComplete")
        if legacy, !standbyOnboardingCompleted {
            standbyOnboardingCompleted = true
        }
    }

    @MainActor
    private func runStandbyOnboardingGate() async {
        guard env.sessionStore.isSignedIn else {
            showStandbyOnboarding = false
            return
        }

        migrateLegacyStandbyOnboardingKeys()

        let completed = standbyOnboardingCompleted
            || UserDefaults.standard.bool(forKey: "pf.onboarding.standbyFirstRunComplete")

        let gate = StandbyOnboardingGateViewModel(api: env.apiClient)
        await gate.load(
            onboardingCompleted: completed,
            onboardingDismissed: standbyOnboardingDismissed
        )

        showStandbyOnboarding = gate.shouldShowOnboarding
    }

    @MainActor
    private func completeStandbyOnboarding(landing: StandbyOnboardingFinish) {
        standbyOnboardingCompleted = true
        standbyOnboardingDismissed = false
        standbyJustCompleted = true
        showStandbyOnboarding = false

        switch landing {
        case .landOnProfile:
            env.customerNavigation.selectedTab = .profile
        case .openStandbyStatus:
            DispatchQueue.main.async {
                env.customerNavigation.open(.standbyStatus)
            }
        }
    }

    @MainActor
    private func dismissStandbyOnboarding() {
        standbyOnboardingDismissed = true
        showStandbyOnboarding = false
    }
}

#Preview {
    MainShellView()
        .environmentObject(AppEnvironment.development)
        .environmentObject(AppEnvironment.development.sessionStore)
}
