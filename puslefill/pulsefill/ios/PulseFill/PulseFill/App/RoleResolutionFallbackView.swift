import SwiftUI

/// Signed-in state when `/v1/auth/me` failed or the account has no customer/staff roles.
struct RoleResolutionFallbackView: View {
    @EnvironmentObject private var env: AppEnvironment
    let kind: RoleResolutionFallbackKind

    var body: some View {
        ZStack {
            PFScreenBackground()

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    PFCustomerSectionCard(variant: .default, padding: 20) {
                        VStack(alignment: .leading, spacing: 14) {
                            Text(title)
                                .font(.system(size: 20, weight: .bold))
                                .foregroundStyle(PFColor.textPrimary)
                                .fixedSize(horizontal: false, vertical: true)

                            Text(message)
                                .font(.system(size: 15, weight: .medium))
                                .foregroundStyle(PFColor.textSecondary)
                                .lineSpacing(3)
                                .fixedSize(horizontal: false, vertical: true)

                            VStack(spacing: 12) {
                                PFCustomerPrimaryButton(
                                    title: "Try again",
                                    isEnabled: !env.userRoleContext.isLoading,
                                    isLoading: env.userRoleContext.isLoading
                                ) {
                                    Task {
                                        await env.userRoleContext.refreshFromServer(legacyMigrationHint: false)
                                    }
                                }
                                PFCustomerSecondaryButton(
                                    title: "Sign out",
                                    isEnabled: !env.userRoleContext.isLoading
                                ) {
                                    Task { await env.authManager.signOut() }
                                }
                            }
                            .padding(.top, 4)
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 28)
                .padding(.bottom, 40)
            }
        }
    }

    private var title: String {
        switch kind {
        case .lookupFailed:
            "We couldn’t load your PulseFill access"
        case .noRoles:
            "No PulseFill access yet"
        }
    }

    private var message: String {
        switch kind {
        case .lookupFailed:
            "Your account is signed in, but PulseFill couldn’t confirm whether this account should open customer or business tools."
        case .noRoles:
            "This account is signed in, but it isn’t connected to a customer profile or business workspace yet."
        }
    }
}

/// First paint after restore/sign-in before role resolution finishes.
struct RoleResolutionLoadingView: View {
    var body: some View {
        ZStack {
            PFScreenBackground()

            PFCustomerSectionCard(variant: .quiet, padding: 24) {
                PFCustomerLoadingState(
                    title: "Checking your access…",
                    message: "Confirming how this account can use PulseFill."
                )
            }
            .padding(.horizontal, 20)
        }
    }
}
