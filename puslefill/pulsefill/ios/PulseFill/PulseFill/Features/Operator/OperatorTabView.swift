import SwiftUI

struct OperatorTabView: View {
    @EnvironmentObject private var env: AppEnvironment

    var body: some View {
        TabView {
            OperatorOverviewView(api: env.apiClient)
                .environmentObject(env)
                .tabItem {
                    Label("Overview", systemImage: "house")
                }

            OperatorActionQueueView(api: env.apiClient)
                .environmentObject(env)
                .tabItem {
                    Label("Queue", systemImage: "exclamationmark.bubble")
                }

            OperatorSlotsListView(businessAPI: env.businessOperatorAPI)
                .environmentObject(env)
                .tabItem {
                    Label("Slots", systemImage: "calendar")
                }

            CustomerActivityFeedView(api: env.apiClient)
                .environmentObject(env)
                .tabItem {
                    Label("Activity", systemImage: "clock.arrow.circlepath")
                }

            ProfileView()
                .environmentObject(env)
                .tabItem {
                    Label("Settings", systemImage: "person.crop.circle")
                }
        }
        .tint(PFColor.primary)
        .toolbarBackground(PFColor.operatorTabBar, for: .tabBar)
        .toolbarBackground(.visible, for: .tabBar)
        .toolbarColorScheme(.dark, for: .tabBar)
    }
}
