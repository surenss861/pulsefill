import SwiftUI

struct RootTabView: View {
    @EnvironmentObject private var env: AppEnvironment

    @AppStorage("pf.onboarding.standby.completed") private var standbyOnboardingCompleted = false
    @AppStorage("pf.onboarding.standby.dismissed") private var standbyOnboardingDismissed = false
    @AppStorage("pf.onboarding.standby.justCompleted") private var standbyJustCompleted = false

    @State private var showStandbyOnboarding = false

    var body: some View {
        ZStack(alignment: .top) {
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
                    .tabItem { Label("Activity", systemImage: "list.bullet.rectangle") }
                    .tag(AppTab.activity)

                ProfileView()
                    .tabItem { Label("Profile", systemImage: "person.crop.circle") }
                    .tag(AppTab.profile)
            }
            .tint(PFColor.ember)
            .toolbarBackground(PFColor.customerTabBar, for: .tabBar)
            .toolbarBackground(.visible, for: .tabBar)
            .toolbarColorScheme(.dark, for: .tabBar)

            if let msg = env.sessionStore.inviteSuccessBanner {
                inviteSuccessBannerView(message: msg) {
                    env.sessionStore.inviteSuccessBanner = nil
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
            }
        }
        .onChange(of: env.sessionStore.standbyOnboardingRecheck) { _, _ in
            Task { await runStandbyOnboardingGate() }
        }
        .onChange(of: env.customerNavigation.selectedTab) { _, _ in
            PFHaptics.selection()
        }
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

    private func inviteSuccessBannerView(message: String, onDismiss: @escaping () -> Void) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Text(message)
                .font(.system(size: 14, weight: .medium))
                .lineSpacing(3)
                .foregroundStyle(PFColor.textPrimary)
            Spacer(minLength: 0)
            Button {
                onDismiss()
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(PFColor.textMuted)
            }
            .buttonStyle(.plain)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(PFColor.customerCardElevated)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(PFColor.hairline, lineWidth: 1)
        )
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
