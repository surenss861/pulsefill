import SwiftUI

/// Business mode account — workspace context, mode switch, safe sign-out (not the shared customer `ProfileView`).
struct BusinessAccountView: View {
    @EnvironmentObject private var env: AppEnvironment
    @State private var confirmSignOut = false
    /// When `false`, embed inside a parent `NavigationStack` (e.g. **More** hub). Default `true` for standalone use.
    var wrapsInNavigationStack: Bool = true

    private var presentation: BusinessWorkspacePresentation {
        BusinessWorkspacePresentation.resolve(
            authMe: env.userRoleContext.authMe,
            sessionEmail: env.sessionStore.email
        )
    }

    private var dualRole: Bool {
        guard let roles = env.userRoleContext.authMe?.roles else { return false }
        return roles.customer && roles.staff
    }

    var body: some View {
        let accountBody = ZStack {
            PFScreenBackground()

            ScrollView {
                VStack(alignment: .leading, spacing: PFOperatorShellMetrics.sectionSpacing) {
                    BusinessWorkspaceStrip()
                        .environmentObject(env)

                    workspaceCard

                    PFOperatorHero(
                        overline: "Signed in",
                        title: "Workspace",
                        subtitle: "Switch modes, see who you’re operating as, or sign out."
                    )

                    modeCard

                    if dualRole {
                        customerModeCard
                    }

                    diagnosticsCard

                    signOutCard
                }
                .pfOperatorHorizontalPadding()
                .padding(.top, 16)
                .padding(.bottom, 40)
            }
        }
        .navigationTitle("Account")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(PFColor.surface1, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .confirmationDialog(
            "Sign out?",
            isPresented: $confirmSignOut,
            titleVisibility: .visible
        ) {
            Button("Sign out", role: .destructive) {
                Task { await env.authManager.signOut() }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("You’ll need to sign in again to access this business.")
        }

        if wrapsInNavigationStack {
            NavigationStack {
                accountBody
            }
        } else {
            accountBody
        }
    }

    private var workspaceCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "building.2.crop.circle.fill")
                    .font(.system(size: 28, weight: .semibold))
                    .foregroundStyle(PFColor.primary)

                VStack(alignment: .leading, spacing: 6) {
                    Text(presentation.businessName)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(PFColor.textPrimary)
                        .fixedSize(horizontal: false, vertical: true)

                    Text("Role · \(presentation.roleLabel)")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)

                    if let email = presentation.signedInEmail {
                        Text(email)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(PFColor.textSecondary)
                            .textSelection(.enabled)
                    } else {
                        Text("Staff email unavailable")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(PFColor.textSecondary)
                    }
                }
                Spacer(minLength: 0)
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .stroke(PFColor.textSecondary.opacity(0.12), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }

    private var modeCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("CURRENT MODE")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)
                .tracking(0.5)

            HStack(spacing: 10) {
                Image(systemName: "briefcase.fill")
                    .foregroundStyle(PFColor.primary)
                Text("Business (operator)")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)
                Spacer()
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }

    private var customerModeCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("You also have a customer profile on this account. Switch when you want standby, offers, and personal activity — not business tools.")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(PFColor.textSecondary)
                .fixedSize(horizontal: false, vertical: true)

            Button {
                env.userRoleContext.chooseCustomerMode()
            } label: {
                Text("Switch to Customer mode")
                    .font(.system(size: 16, weight: .bold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
            }
            .buttonStyle(.borderedProminent)
            .tint(PFColor.ember)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .stroke(PFColor.ember.opacity(0.25), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }

    private var diagnosticsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("APP")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)
            Text(PulseFillBuildConfiguration.operatorClientBuildLine)
                .font(.system(size: 13, weight: .medium, design: .monospaced))
                .foregroundStyle(PFColor.textSecondary)
                .textSelection(.enabled)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFColor.textSecondary.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }

    private var signOutCard: some View {
        Button {
            confirmSignOut = true
        } label: {
            Text("Sign out")
                .font(.system(size: 16, weight: .semibold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
        }
        .buttonStyle(.bordered)
        .tint(PFColor.error)
    }
}
