import SwiftUI

struct RootTabView: View {
    @EnvironmentObject private var env: AppEnvironment

    var body: some View {
        TabView(
            selection: Binding(
                get: { env.navigationRouter.selectedTab },
                set: { env.navigationRouter.selectedTab = $0 }
            )
        ) {
            HomeView()
                .tabItem { Label("Home", systemImage: "house.fill") }
                .tag(AppTab.home)

            OffersInboxView()
                .tabItem { Label("Offers", systemImage: "bell.badge.fill") }
                .tag(AppTab.offers)

            ActivityView()
                .tabItem { Label("Activity", systemImage: "clock.fill") }
                .tag(AppTab.activity)

            ProfileView()
                .tabItem { Label("Profile", systemImage: "person.crop.circle") }
                .tag(AppTab.profile)
        }
        .tint(PFColor.primary)
    }
}

#Preview {
    MainShellView()
        .environmentObject(AppEnvironment.development)
        .environmentObject(AppEnvironment.development.sessionStore)
}
