import SwiftUI

/// Branded **More** hub — dark shell, card destinations (replaces separate Customers + Account tabs).
struct BusinessMoreView: View {
    @EnvironmentObject private var env: AppEnvironment
    @Binding var morePath: NavigationPath

    var body: some View {
        NavigationStack(path: $morePath) {
            ScrollView {
                VStack(alignment: .leading, spacing: PFOperatorShellMetrics.sectionSpacing) {
                    BusinessWorkspaceStrip()
                        .environmentObject(env)

                    PFOperatorHero(
                        overline: "Tools",
                        title: "Customers & account",
                        subtitle: "Invite people to your waiting list or manage sign-in and workspace."
                    )

                    VStack(spacing: PFOperatorShellMetrics.stackSpacing) {
                        PFOperatorMoreDestinationRow(
                            systemImage: "person.2.fill",
                            title: "Customers",
                            subtitle: "Invite customers and manage your waiting list.",
                            action: { morePath.append(BusinessMoreRoute.customers) }
                        )

                        PFOperatorMoreDestinationRow(
                            systemImage: "person.crop.circle.fill",
                            title: "Account",
                            subtitle: "Workspace, mode switch, and sign out.",
                            action: { morePath.append(BusinessMoreRoute.account) }
                        )
                    }
                }
                .pfOperatorHorizontalPadding()
                .padding(.top, 12)
                .pfOperatorTabBarContentInset()
            }
            .background(PFScreenBackground().ignoresSafeArea())
            .navigationTitle("More")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(PFColor.surface1, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .navigationDestination(for: BusinessMoreRoute.self) { route in
                switch route {
                case .customers:
                    BusinessOperatorCustomersView(businessAPI: env.businessOperatorAPI)
                        .environmentObject(env)
                case .account:
                    BusinessAccountView(wrapsInNavigationStack: false)
                        .environmentObject(env)
                }
            }
        }
    }
}
