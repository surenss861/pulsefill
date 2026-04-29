import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var env: AppEnvironment
    @AppStorage("pf.preferCustomerTabs") private var preferCustomerTabs = false
    @AppStorage("pf.onboarding.standby.justCompleted") private var standbyJustCompleted = false
    @State private var path = NavigationPath()
    @State private var businessInviteToken = ""
    @State private var inviteInlineError: String?
    @State private var inviteInlineSuccess: String?
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
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    if standbyJustCompleted {
                        onboardingCompletionBanner
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        PFTypography.Customer.screenTitle("Profile")
                            .multilineTextAlignment(.leading)
                        PFTypography.Customer.screenLead("Account, alerts, and standby in one place.")
                    }

                    accountCard

                    businessInviteCard

                    findBusinessesCard

                    CustomerSectionCard {
                        VStack(alignment: .leading, spacing: 0) {
                            profileNavRow(
                                title: "Standby status",
                                subtitle: "See if you’re set up to receive openings",
                                destination: .standbyStatus
                            )
                            Divider().background(PFColor.hairline)
                            profileNavRow(
                                title: "Notification settings",
                                subtitle: "Quiet hours and how we reach you",
                                destination: .notificationSettings
                            )
                            Divider().background(PFColor.hairline)
                            profileNavRow(
                                title: "Earlier openings you missed",
                                subtitle: "Past times that didn’t work out",
                                destination: .missedOpportunities
                            )
                        }
                    }

                    CustomerSectionCard {
                        NavigationLink {
                            StandbyPreferencesView(api: env.apiClient)
                                .environmentObject(env)
                        } label: {
                            ProfileRow(
                                title: "Standby preferences",
                                subtitle: "Preferred days, times, and locations"
                            )
                        }
                        .buttonStyle(.plain)
                    }

                    #if DEBUG
                    pushDebugCard
                    #endif

                    Button(role: .destructive) {
                        Task { await env.authManager.signOut() }
                    } label: {
                        Text("Sign out")
                            .font(.system(size: 17, weight: .semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(PFColor.error)
                    .padding(.top, 8)
                }
                .padding(.horizontal, 20)
                .padding(.top, 24)
                .padding(.bottom, 36)
            }
            .background(CustomerScreenBackground())
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(PFColor.customerTabBar, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .tint(PFColor.ember)
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

    private var findBusinessesCard: some View {
        CustomerSectionCard {
            VStack(alignment: .leading, spacing: 10) {
                PFTypography.Customer.label("Find businesses")
                Text("Browse clinics that listed themselves in PulseFill, or connect with an invite from your clinic.")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)
                Button {
                    PFHaptics.lightImpact()
                    env.customerNavigation.selectedTab = .find
                } label: {
                    Text("Open directory")
                        .font(.system(size: 16, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                }
                .buttonStyle(.bordered)
                .tint(PFColor.ember)
            }
        }
    }

    private var businessInviteCard: some View {
        CustomerSectionCard {
            VStack(alignment: .leading, spacing: 10) {
                PFTypography.Customer.label("Business invite")
                Text("Your clinic sent you an invite link or code. Paste the code here so we can show you earlier appointment openings from that clinic.")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)
                TextField("Invite code", text: $businessInviteToken)
                    .textFieldStyle(.plain)
                    .font(.system(size: 15, weight: .medium))
                    .padding(12)
                    .background(
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .fill(PFColor.customerCard)
                    )
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                if let success = inviteInlineSuccess {
                    Text(success)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(PFColor.success)
                        .lineSpacing(2)
                }
                if let err = inviteInlineError {
                    Text(err)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(PFColor.error)
                        .lineSpacing(2)
                }
                Button {
                    Task { await acceptInvite() }
                } label: {
                    HStack(spacing: 8) {
                        if env.authManager.isBusy {
                            ProgressView()
                                .tint(.black)
                        }
                        Text(env.authManager.isBusy ? "Accepting…" : "Accept invite")
                            .font(.system(size: 16, weight: .semibold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                }
                .buttonStyle(.borderedProminent)
                .tint(PFColor.ember)
                .disabled(businessInviteToken.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || env.authManager.isBusy)
            }
        }
    }

    private var accountCard: some View {
        CustomerSectionCard {
            VStack(alignment: .leading, spacing: 12) {
                PFTypography.Customer.label("Account")

                if let email = env.sessionStore.email, !email.isEmpty {
                    Text(email)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(PFColor.textPrimary)
                } else {
                    Text("Not signed in")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)
                }

                #if DEBUG
                if let uid = env.sessionStore.userId {
                    Text("User ID: \(uid)")
                        .font(.caption)
                        .foregroundStyle(PFColor.customerTextTertiary)
                        .textSelection(.enabled)
                }
                #endif

                if env.sessionStore.isStaffUser {
                    Toggle("Customer mode (standby & offers)", isOn: $preferCustomerTabs)
                        .font(.system(size: 15, weight: .medium))
                        .tint(PFColor.ember)
                }

                HStack {
                    Text("Push")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(PFColor.textSecondary)
                    Spacer()
                    Text(notificationsSummary)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(PFColor.textPrimary)
                }
                .padding(.top, 4)
            }
        }
    }

    private var notificationsSummary: String {
        switch pushDebug.permission.lowercased() {
        case "authorized":
            return "Notifications on"
        case "denied":
            return "Notifications off"
        case "not_determined":
            return "Permission needed"
        default:
            return pushDebug.permission
        }
    }

    private var onboardingCompletionBanner: some View {
        CustomerSectionCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("Standby is active")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)

                Text("You’re set up to receive openings that match what you saved.")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)
            }
        }
    }

    #if DEBUG
    private var pushDebugCard: some View {
        CustomerSectionCard {
            VStack(alignment: .leading, spacing: 10) {
                PFTypography.Customer.label("Push debug")

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
    }
    #endif

    private func profileNavRow(title: String, subtitle: String, destination: CustomerDestination) -> some View {
        NavigationLink(value: destination) {
            ProfileRow(title: title, subtitle: subtitle)
        }
        .buttonStyle(.plain)
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
                .environmentObject(env)

        case let .claimOutcome(claimId):
            ClaimOutcomeView(api: env.apiClient, claimId: claimId)

        case .activity:
            EmptyView()

        case let .standbySetup(businessId, serviceId, businessName):
            StandbyPreferencesView(
                api: env.apiClient,
                navigationTitleOverride: "Standby preferences",
                initialBusinessId: businessId,
                initialBusinessDisplayName: businessName,
                initialServiceId: serviceId,
                lockBusinessSelection: true
            )
            .environmentObject(env)
        }
    }

    private func acceptInvite() async {
        inviteInlineError = nil
        inviteInlineSuccess = nil
        let token = businessInviteToken.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !token.isEmpty else {
            inviteInlineError = "Enter the invite code from your clinic."
            return
        }

        let result = await env.authManager.acceptInviteTokenNow(token)
        switch result {
        case .success:
            inviteInlineSuccess = "Invite accepted. Set your standby preferences to get earlier appointment openings."
            businessInviteToken = ""
        case let .failure(message):
            inviteInlineError = message
        }
    }

    private func consumePendingRouteIfNeeded() {
        guard env.customerNavigation.selectedTab == .profile else { return }
        if let destination = env.customerNavigation.takePendingDestination(matching: {
            switch $0 {
            case .standbyStatus, .notificationSettings, .missedOpportunities, .standbySetup:
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
