import SwiftUI

/// Chooses customer tabs vs operator console when the signed-in user is staff.
struct MainShellView: View {
    @EnvironmentObject private var env: AppEnvironment
    /// When `true`, staff users see the customer tab shell instead of the operator shell.
    @AppStorage("pf.preferCustomerTabs") private var preferCustomerTabs = false

    var body: some View {
        Group {
            if let configIssue = env.clientConfigurationBlockingMessage {
                ClientConfigurationBlockingView(message: configIssue)
            } else if !env.sessionStore.isSignedIn {
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

// MARK: - Misconfigured build (missing Supabase anon / bad URLs)

private struct ClientConfigurationBlockingView: View {
    let message: String
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack {
            AuthMetalBackgroundView(reduceMotion: reduceMotion)
                .ignoresSafeArea()

            VStack(spacing: 18) {
                Image(systemName: "wifi.exclamationmark")
                    .font(.system(size: 36, weight: .semibold))
                    .foregroundStyle(PFColor.ember)

                Text("Connection problem")
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(.white.opacity(0.94))
                    .multilineTextAlignment(.center)

                Text(message)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.white.opacity(0.72))
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .padding(.horizontal, 28)

                Text("If this keeps happening, try again later or reinstall PulseFill from the link the business shared.")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Color.white.opacity(0.42))
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
                    .padding(.horizontal, 32)
                    .padding(.top, 8)
            }
            .padding(.vertical, 40)
        }
    }
}
