import SwiftUI

/// Lightweight **Business mode** shell — task-first mobile operator tabs (v1 reuses existing operator screens where available).
struct BusinessTabView: View {
    @EnvironmentObject private var env: AppEnvironment
    @State private var selectedTab: BusinessShellTab = .today
    @State private var morePath = NavigationPath()

    var body: some View {
        TabView(selection: $selectedTab) {
            BusinessTodayView(
                businessAPI: env.businessOperatorAPI,
                selectedTab: $selectedTab,
                onNavigateMore: { route in
                    selectedTab = .more
                    morePath = NavigationPath([route])
                }
            )
                .environmentObject(env)
                .tabItem { Label("Today", systemImage: "sun.max.fill") }
                .tag(BusinessShellTab.today)

            OperatorSlotsListView(
                businessAPI: env.businessOperatorAPI,
                businessShellSelectedTab: $selectedTab
            )
                .environmentObject(env)
                .tabItem { Label("Openings", systemImage: "calendar") }
                .tag(BusinessShellTab.openings)

            OperatorCreateOpeningView(businessAPI: env.businessOperatorAPI)
                .environmentObject(env)
                .tabItem { Label("Add", systemImage: "plus.circle.fill") }
                .tag(BusinessShellTab.create)

            OperatorClaimsView(businessAPI: env.businessOperatorAPI)
                .environmentObject(env)
                .tabItem {
                    Label("Claims", systemImage: "checkmark.seal")
                        .accessibilityLabel("Customer claims")
                }
                .tag(BusinessShellTab.claims)

            BusinessMoreView(morePath: $morePath)
                .environmentObject(env)
                .tabItem { Label("More", systemImage: "ellipsis.circle.fill") }
                .tag(BusinessShellTab.more)
        }
        .tint(PFColor.primary)
        .toolbarBackground(PFColor.operatorTabBar, for: .tabBar)
        .toolbarBackground(.visible, for: .tabBar)
        .toolbarColorScheme(.dark, for: .tabBar)
        .pfScreenBackground()
    }
}

