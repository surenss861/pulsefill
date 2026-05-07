import SwiftUI

/// Lightweight **Business mode** shell — task-first mobile operator tabs (v1 reuses existing operator screens where available).
struct BusinessTabView: View {
    @EnvironmentObject private var env: AppEnvironment
    @State private var selectedTab: BusinessShellTab = .today

    var body: some View {
        TabView(selection: $selectedTab) {
            BusinessTodayView(businessAPI: env.businessOperatorAPI, selectedTab: $selectedTab)
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
                .tabItem { Label("Create", systemImage: "plus.circle.fill") }
                .tag(BusinessShellTab.create)

            OperatorClaimsView(businessAPI: env.businessOperatorAPI)
                .environmentObject(env)
                .tabItem { Label("Claims", systemImage: "checkmark.seal") }
                .tag(BusinessShellTab.claims)

            BusinessOperatorCustomersView(businessAPI: env.businessOperatorAPI)
                .environmentObject(env)
                .tabItem { Label("Customers", systemImage: "person.2") }
                .tag(BusinessShellTab.customers)

            BusinessAccountView()
                .environmentObject(env)
                .tabItem { Label("Account", systemImage: "person.crop.circle") }
                .tag(BusinessShellTab.account)
        }
        .tint(PFColor.primary)
    }
}

