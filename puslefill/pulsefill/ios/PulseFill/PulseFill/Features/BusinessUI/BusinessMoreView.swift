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
                        overline: "More",
                        title: "Customers & workspace",
                        subtitle: "Invite waiting customers or open Workspace for account access and sign out.",
                        showLivePulse: true,
                        uppercaseOverline: false
                    )

                    VStack(spacing: PFOperatorShellMetrics.stackSpacing) {
                        PFOperatorMoreDestinationRow(
                            systemImage: "person.2.fill",
                            title: "Customers",
                            subtitle: "Invite customers so they can get openings when someone cancels.",
                            action: { morePath.append(BusinessMoreRoute.customers) }
                        )

                        PFOperatorMoreDestinationRow(
                            systemImage: "person.crop.circle.fill",
                            title: "Account",
                            subtitle: "Manage business mode, account access, and sign out.",
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
