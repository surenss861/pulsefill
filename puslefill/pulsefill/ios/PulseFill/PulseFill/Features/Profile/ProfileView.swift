import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var env: AppEnvironment
    @AppStorage("pf.preferCustomerTabs") private var preferCustomerTabs = false
    @AppStorage("pf.onboarding.standby.justCompleted") private var standbyJustCompleted = false
    @State private var path = NavigationPath()
    @State private var pushDebug = PushDebugSnapshot(
        permission: "Unknown",
        registrationState: .never,
        registrationAt: nil,
        deactivationState: .never,
        deactivationAt: nil,
        environment: "Unknown",
        appBuild: "Unknown",
        maskedToken: nil
    )

    var body: some View {
        NavigationStack(path: $path) {
            List {
                if standbyJustCompleted {
                    onboardingCompletionBanner
                }

                standbySection
                preferencesSection
                pushDebugSection

                Section {
                    if let uid = env.sessionStore.userId {
                        LabeledContent("User", value: uid)
                    } else {
                        Text("Not signed in").foregroundStyle(PFColor.textSecondary)
                    }
                    if let email = env.sessionStore.email, !email.isEmpty {
                        LabeledContent("Email", value: email)
                    }
                    if env.sessionStore.isStaffUser {
                        Toggle(
                            "Customer mode (standby & offers)",
                            isOn: $preferCustomerTabs
                        )
                        .tint(PFColor.primary)
                    }
                }

                Section {
                    Button("Sign out", role: .destructive) {
                        Task { await env.authManager.signOut() }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(PFColor.background)
            .navigationTitle("Account & settings")
            .toolbarBackground(PFColor.surface1, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .onAppear {
                clearCompletionBannerLaterIfNeeded()
                consumePendingRouteIfNeeded()
                Task { await refreshPushDebug() }
            }
            .onChange(of: env.customerNavigation.pendingCustomerDestination) { _, _ in
                consumePendingRouteIfNeeded()
            }
            .onChange(of: env.customerNavigation.selectedTab) { _, tab in
                if tab == .profile {
                    consumePendingRouteIfNeeded()
                    Task { await refreshPushDebug() }
                }
            }
            .navigationDestination(for: CustomerDestination.self) { destination in
                profileDestinationView(for: destination)
            }
        }
    }

    @ViewBuilder
    private func profileDestinationView(for destination: CustomerDestination) -> some View {
        switch destination {
        case .standbyStatus:
            StandbyStatusView(api: env.apiClient)

        case .notificationSettings:
            NotificationPreferencesView(api: env.apiClient)

        case .missedOpportunities:
            MissedOpportunitiesView(api: env.apiClient)

        case let .offerDetail(offerId):
            OfferDetailView(api: env.apiClient, offerId: offerId)

        case let .claimOutcome(claimId):
            ClaimOutcomeView(api: env.apiClient, claimId: claimId)

        case .activity:
            Text("Activity")
                .foregroundStyle(PFColor.textSecondary)
        }
    }

    private var onboardingCompletionBanner: some View {
        Section {
            VStack(alignment: .leading, spacing: 8) {
                Text("Standby is active")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)

                Text("You’re set up to receive matching openings based on your current preferences.")
                    .font(.system(size: 13, weight: .regular))
                    .foregroundStyle(PFColor.textSecondary)
            }
            .padding(.vertical, 4)
        }
    }

    private var standbySection: some View {
        Section("Standby") {
            NavigationLink(value: CustomerDestination.standbyStatus) {
                ProfileRow(
                    title: "Standby status",
                    subtitle: "Check readiness, activity, and current coverage"
                )
            }

            NavigationLink(value: CustomerDestination.notificationSettings) {
                ProfileRow(
                    title: "Notification settings",
                    subtitle: "Quiet hours, cadence, and alert types"
                )
            }

            NavigationLink(value: CustomerDestination.missedOpportunities) {
                ProfileRow(
                    title: "Recent missed opportunities",
                    subtitle: "See what passed by and how to improve"
                )
            }
        }
    }

    private var preferencesSection: some View {
        Section("Preferences") {
            NavigationLink {
                StandbyPreferencesView(api: env.apiClient)
                    .environmentObject(env)
            } label: {
                ProfileRow(
                    title: "Standby preferences",
                    subtitle: "Create, edit, pause, or remove standby preferences"
                )
            }
        }
    }

    private var pushDebugSection: some View {
        Section("Push notifications") {
            LabeledContent("Permission", value: pushDebug.permission)
            LabeledContent("Registration", value: attemptLabel(state: pushDebug.registrationState, at: pushDebug.registrationAt))
            LabeledContent("Deactivation", value: attemptLabel(state: pushDebug.deactivationState, at: pushDebug.deactivationAt))
            LabeledContent("Environment", value: pushDebug.environment)
            LabeledContent("App build", value: pushDebug.appBuild)
            if let token = pushDebug.maskedToken {
                LabeledContent("Token", value: token)
            } else {
                LabeledContent("Token", value: "—")
            }
        }
    }

    private func consumePendingRouteIfNeeded() {
        guard env.customerNavigation.selectedTab == .profile else { return }
        if let destination = env.customerNavigation.takePendingDestination(matching: {
            switch $0 {
            case .standbyStatus, .notificationSettings, .missedOpportunities:
                return true
            default:
                return false
            }
        }) {
            path.append(destination)
        }
    }

    private func clearCompletionBannerLaterIfNeeded() {
        guard standbyJustCompleted else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            standbyJustCompleted = false
        }
    }

    private func refreshPushDebug() async {
        await env.pushRegistrationManager.refreshAuthorizationStatus()
        pushDebug = env.pushRegistrationManager.debugSnapshot()
    }

    private func attemptLabel(state: PushDebugSnapshot.AttemptState, at: Date?) -> String {
        guard let at else { return state.rawValue }
        return "\(state.rawValue) · \(at.formatted(date: .abbreviated, time: .shortened))"
    }
}
