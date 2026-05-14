import SwiftUI

/// Chooses customer tabs vs business shell using `UserRoleContext` (dual-role picker when needed).
struct MainShellView: View {
    @EnvironmentObject private var env: AppEnvironment

    var body: some View {
        Group {
            if let configIssue = env.clientConfigurationBlockingMessage {
                ClientConfigurationBlockingView(
                    message: configIssue,
                    diagnostics: env.clientConfigurationDiagnostics
                )
            } else if !env.sessionStore.isSignedIn {
                AuthLandingView()
            } else if !env.userRoleContext.hasCompletedRoleResolution {
                RoleResolutionLoadingView()
            } else if env.userRoleContext.needsRoleResolutionFallback {
                RoleResolutionFallbackView(kind: env.userRoleContext.roleResolutionFallbackKind)
            } else if env.userRoleContext.needsRolePicker {
                RoleSelectionView()
            } else if env.userRoleContext.shouldShowBusinessShell {
                BusinessTabView()
            } else {
                RootTabView()
            }
        }
        .animation(.easeInOut(duration: 0.2), value: env.sessionStore.isSignedIn)
        .animation(.easeInOut(duration: 0.2), value: env.userRoleContext.hasCompletedRoleResolution)
        .animation(.easeInOut(duration: 0.2), value: env.userRoleContext.needsRoleResolutionFallback)
        .animation(.easeInOut(duration: 0.2), value: env.userRoleContext.needsRolePicker)
        .animation(.easeInOut(duration: 0.2), value: env.userRoleContext.shouldShowBusinessShell)
    }
}

// MARK: - Misconfigured build (missing Supabase anon / bad URLs)

private struct ClientConfigurationBlockingView: View {
    let message: String
    let diagnostics: PulseFillClientLaunchDiagnostics?

    var body: some View {
        ZStack {
            PFScreenBackground()

            ScrollView {
                VStack(spacing: 18) {
                    Image(systemName: "wifi.exclamationmark")
                        .font(.system(size: 36, weight: .semibold))
                        .foregroundStyle(PFColor.ember)

                    Text("Connection problem")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundStyle(PFColor.textPrimary)
                        .multilineTextAlignment(.center)

                    Text(message)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(PFColor.textSecondary)
                        .multilineTextAlignment(.center)
                        .lineSpacing(4)
                        .padding(.horizontal, 28)

                    if let d = diagnostics {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Diagnostics")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(PFColor.textPrimary)
                            Group {
                                Text("Tier: \(d.tierLabel)")
                                Text("API: \(d.apiHost)")
                                Text("Supabase: \(d.supabaseHost)")
                                Text("Anon key: \(d.anonKeyStatus)")
                                if let err = d.safeFailureSummary, !err.isEmpty {
                                    Text("Last error: \(err)")
                                }
                            }
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(PFColor.textMuted)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(14)
                        .background(PFColor.surface2.opacity(0.6), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                        .padding(.horizontal, 24)
                    }

                    Text("If this keeps happening, try again later or reinstall PulseFill from the link the business shared.")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(PFColor.textMuted)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                        .padding(.horizontal, 32)
                        .padding(.top, 8)
                }
                .padding(.vertical, 40)
            }
        }
    }
}
