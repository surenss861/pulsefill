import SwiftUI

/// Chooses customer tabs vs operator console when the signed-in user is staff.
struct MainShellView: View {
    @EnvironmentObject private var env: AppEnvironment
    /// When `true`, staff users see the customer tab shell instead of the operator shell.
    @AppStorage("pf.preferCustomerTabs") private var preferCustomerTabs = false

    var body: some View {
        Group {
            if !env.sessionStore.isSignedIn {
                AuthLandingView()
            } else if env.sessionStore.isStaffUser, !preferCustomerTabs {
                OperatorTabView()
            } else {
                RootTabView()
            }
        }
        .animation(.easeInOut(duration: 0.2), value: env.sessionStore.isStaffUser)
        .animation(.easeInOut(duration: 0.2), value: preferCustomerTabs)
    }
}
