import SwiftUI

struct OperatorTabView: View {
    @EnvironmentObject private var env: AppEnvironment

    var body: some View {
        TabView {
            OperatorActionQueueView(api: env.apiClient)
                .environmentObject(env)
                .tabItem {
                    Label("Queue", systemImage: "exclamationmark.bubble")
                }

            OperatorSlotsListView()
                .environmentObject(env)
                .tabItem {
                    Label("Slots", systemImage: "calendar")
                }

            OperatorClaimsView(api: env.apiClient)
                .environmentObject(env)
                .tabItem {
                    Label("Claims", systemImage: "checkmark.seal")
                }

            ActivityView()
                .environmentObject(env)
                .tabItem {
                    Label("Activity", systemImage: "clock.arrow.circlepath")
                }

            ProfileView()
                .environmentObject(env)
                .tabItem {
                    Label("Profile", systemImage: "person.crop.circle")
                }
        }
        .tint(PFColor.primary)
    }
}
