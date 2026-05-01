import SwiftUI

private enum ProfileInviteScrollTarget: String {
    case inviteCode = "profileInviteCode"
}

struct ProfileView: View {
    @EnvironmentObject private var env: AppEnvironment
    @AppStorage("pf.preferCustomerTabs") private var preferCustomerTabs = false
    @AppStorage("pf.onboarding.standby.justCompleted") private var standbyJustCompleted = false
    @State private var path = NavigationPath()
    @State private var businessInviteToken = ""
    @State private var inviteInlineError: String?
    @State private var inviteInlineSuccess: String?
    @FocusState private var inviteCodeFieldFocused: Bool
    @State private var inviteSectionEmphasized = false
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
            ZStack {
                PFScreenBackground()

                ScrollViewReader { proxy in
                    ScrollView {
                        VStack(alignment: .leading, spacing: 22) {
                            if standbyJustCompleted {
                                onboardingCompletionBanner
                            }

                            VStack(alignment: .leading, spacing: 8) {
                                PFTypography.Customer.screenTitle("Profile")
                                    .multilineTextAlignment(.leading)
                                PFTypography.Customer.screenLead(
                                    "Manage your businesses, standby preferences, notifications, and account."
                                )
                            }

                            PFCustomerInfoCallout(
                                title: "How Profile fits in",
                                message:
                                    "Use an invite code to connect to a business, find businesses in PulseFill, then set standby so matching openings can reach you.",
                                variant: .neutral
                            )

                            inviteCodeSection
                            yourBusinessesCard
                            standbyPreferencesCard
                            notificationsCard

                            #if DEBUG
                            pushDebugCard
                            #endif

                            accountCard
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 24)
                        .padding(.bottom, 36)
                    }
                    .onAppear {
                        clearCompletionBannerLaterIfNeeded()
                        consumePendingRouteIfNeeded()
                        Task { await refreshPushDebug() }
                        focusInviteSectionIfNeeded(proxy: proxy)
                    }
                    .onChange(of: env.customerNavigation.focusProfileInviteSection) { _, shouldFocus in
                        if shouldFocus {
                            focusInviteSectionIfNeeded(proxy: proxy)
                        }
                    }
                    .onChange(of: env.customerNavigation.selectedTab) { _, tab in
                        if tab == .profile {
                            consumePendingRouteIfNeeded()
                            Task { await refreshPushDebug() }
                            focusInviteSectionIfNeeded(proxy: proxy)
                        }
                    }
                }
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(PFColor.customerTabBar, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .tint(PFColor.ember)
            .onChange(of: env.customerNavigation.pendingCustomerDestination) { _, _ in
                consumePendingRouteIfNeeded()
            }
            .navigationDestination(for: CustomerDestination.self) { destination in
                profileDestinationView(for: destination)
            }
        }
    }

    private var onboardingCompletionBanner: some View {
        PFCustomerSectionCard(variant: .elevated, padding: 18) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Standby is active")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)

                Text("You’re set up to receive openings that match what you saved.")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Invite code

    private var inviteCodeCard: some View {
        PFCustomerSectionCard(variant: .default, padding: 18) {
            VStack(alignment: .leading, spacing: 12) {
                Text("Have an invite code?")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)

                Text(
                    "Use an invite code from a business to connect and set standby preferences."
                )
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(PFColor.textSecondary)
                .lineSpacing(3)

                TextField("Invite code", text: $businessInviteToken)
                    .textFieldStyle(.plain)
                    .font(.system(size: 15, weight: .medium))
                    .padding(12)
                    .background(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(PFColor.customerCard)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .stroke(PFColor.hairline, lineWidth: 1)
                    )
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .focused($inviteCodeFieldFocused)

                if let success = inviteInlineSuccess {
                    Text(success)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(PFColor.success)
                        .lineSpacing(3)
                }
                if let err = inviteInlineError {
                    Text(PFCustomerFacingErrorCopy.sanitizeCustomerMessage(err))
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(PFColor.error)
                        .lineSpacing(3)
                }

                PFCustomerPrimaryButton(
                    title: env.authManager.isBusy ? "Connecting…" : "Connect with invite code",
                    isEnabled: !businessInviteToken.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !env.authManager.isBusy,
                    isLoading: env.authManager.isBusy,
                    action: {
                        Task { await acceptInvite() }
                    }
                )
            }
        }
    }

    private var inviteCodeSection: some View {
        inviteCodeCard
            .id(ProfileInviteScrollTarget.inviteCode.rawValue)
            .overlay {
                if inviteSectionEmphasized {
                    RoundedRectangle(cornerRadius: PFRadius.customerCard, style: .continuous)
                        .stroke(PFColor.ember.opacity(0.88), lineWidth: 2)
                }
            }
    }

    // MARK: - Your businesses

    private var yourBusinessesCard: some View {
        PFCustomerSectionCard(variant: .default, padding: 18) {
            VStack(alignment: .leading, spacing: 12) {
                Text("Your businesses")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)

                Text("Businesses you’ve joined or requested access to appear in Find businesses.")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)

                PFCustomerPrimaryButton(title: "Find businesses", isEnabled: true) {
                    PFHaptics.lightImpact()
                    env.customerNavigation.selectedTab = .find
                }
            }
        }
    }

    // MARK: - Standby preferences

    private var standbyPreferencesCard: some View {
        PFCustomerSectionCard(variant: .default, padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                Text("Standby preferences")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)

                Text("Choose the openings you want to hear about.")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)

                NavigationLink(value: CustomerDestination.standbyStatus) {
                    CustomerPrimaryChromeLabel(title: "View standby status")
                }
                .buttonStyle(.plain)

                NavigationLink {
                    StandbyPreferencesView(api: env.apiClient)
                        .environmentObject(env)
                } label: {
                    Text("Manage standby preferences")
                        .font(.system(size: 16, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                }
                .buttonStyle(.bordered)
                .tint(PFColor.ember)

                NavigationLink(value: CustomerDestination.missedOpportunities) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Earlier openings you missed")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(PFColor.textPrimary)
                            Text("Past times that didn’t work out")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(PFColor.textMuted)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(PFColor.textMuted)
                    }
                    .padding(.vertical, 4)
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Notifications

    private var notificationsCard: some View {
        PFCustomerSectionCard(variant: .default, padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                Text("Notifications")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)

                Text("Control how PulseFill lets you know about new openings.")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)

                HStack {
                    Text("On this device")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(PFColor.textMuted)
                    Spacer()
                    Text(notificationsSummary)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(PFColor.textPrimary)
                }

                NavigationLink(value: CustomerDestination.notificationSettings) {
                    CustomerPrimaryChromeLabel(title: "Notification settings")
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Account

    private var accountCard: some View {
        PFCustomerSectionCard(variant: .quiet, padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                Text("Account")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)

                if let email = env.sessionStore.email, !email.isEmpty {
                    Text("Signed in as \(email)")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)
                        .lineSpacing(3)
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
                    Toggle("Customer mode (standby & openings)", isOn: $preferCustomerTabs)
                        .font(.system(size: 15, weight: .medium))
                        .tint(PFColor.ember)
                }

                Button(role: .destructive) {
                    Task { await env.authManager.signOut() }
                } label: {
                    Text("Sign out")
                        .font(.system(size: 16, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                }
                .buttonStyle(.bordered)
                .tint(PFColor.error)
            }
        }
    }

    #if DEBUG
    private var pushDebugCard: some View {
        PFCustomerSectionCard(variant: .default, padding: 18) {
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

    private func focusInviteSectionIfNeeded(proxy: ScrollViewProxy) {
        guard env.customerNavigation.focusProfileInviteSection else { return }
        guard env.customerNavigation.selectedTab == .profile else { return }
        env.customerNavigation.acknowledgeProfileInviteFocus()
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 200_000_000)
            withAnimation(.easeOut(duration: 0.38)) {
                proxy.scrollTo(ProfileInviteScrollTarget.inviteCode.rawValue, anchor: .center)
            }
            inviteSectionEmphasized = true
            inviteCodeFieldFocused = true
            try? await Task.sleep(nanoseconds: 1_600_000_000)
            inviteSectionEmphasized = false
        }
    }

    private func acceptInvite() async {
        inviteInlineError = nil
        inviteInlineSuccess = nil
        let token = businessInviteToken.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !token.isEmpty else {
            inviteInlineError = "Enter the invite code from your business."
            return
        }

        let result = await env.authManager.acceptInviteTokenNow(token)
        switch result {
        case .success:
            inviteInlineSuccess =
                "You’re connected. Set your standby preferences so we can show you the right openings."
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

    private var notificationsSummary: String {
        switch pushDebug.permission.lowercased() {
        case "authorized":
            return "On"
        case "denied":
            return "Off"
        case "not_determined":
            return "Not set"
        default:
            return pushDebug.permission
        }
    }

    private func attemptLabel(state: PushDebugSnapshot.AttemptState, at: Date?) -> String {
        guard let at else { return state.rawValue }
        return "\(state.rawValue) · \(at.formatted(date: .abbreviated, time: .shortened))"
    }
}
