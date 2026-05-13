import SwiftUI
import UIKit

/// Business tab: operator customer directory from staff customer invites + `/context` drill-in.
struct BusinessOperatorCustomersView: View {
    @EnvironmentObject private var env: AppEnvironment
    @StateObject private var viewModel: BusinessOperatorCustomersViewModel
    @State private var customerPath = NavigationPath()
    @State private var showCreateInvite = false
    @State private var revokeTargetId: String?

    init(businessAPI: BusinessOperatorAPIClient) {
        _viewModel = StateObject(wrappedValue: BusinessOperatorCustomersViewModel(businessAPI: businessAPI))
    }

    var body: some View {
        NavigationStack(path: $customerPath) {
            Group {
                if case let .failed(msg) = viewModel.loadState, !viewModel.didLoadOnce {
                    errorView(msg)
                } else if !viewModel.didLoadOnce, viewModel.loadState == .loading {
                    loadingView
                } else {
                    contentList
                }
            }
            .background(PFScreenBackground().ignoresSafeArea())
            .navigationTitle("Customers")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(PFColor.surface1, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showCreateInvite = true
                    } label: {
                        Label("Invite", systemImage: "envelope.badge")
                    }
                    .tint(PFColor.primary)
                }
            }
            .navigationDestination(for: String.self) { customerId in
                OperatorBusinessCustomerDetailView(businessAPI: env.businessOperatorAPI, customerId: customerId)
            }
        }
        .task {
            await viewModel.load()
        }
        .refreshable {
            await viewModel.refresh()
        }
        .sheet(isPresented: $showCreateInvite) {
            OperatorCustomerInviteCreateSheet { email, name in
                Task {
                    let ok = await viewModel.createInvite(email: email, customerName: name)
                    if ok { showCreateInvite = false }
                }
            }
        }
        .sheet(item: $viewModel.inviteJustCreatedForCopy, onDismiss: {
            viewModel.clearInviteCopyCue()
        }) { invite in
            OperatorInviteCreatedCopySheet(invite: invite, onDone: {
                viewModel.clearInviteCopyCue()
            })
        }
        .alert("Update", isPresented: Binding(
            get: { viewModel.flashMessage != nil },
            set: { if !$0 { viewModel.flashMessage = nil } }
        )) {
            Button("OK", role: .cancel) {
                viewModel.flashMessage = nil
            }
        } message: {
            Text(viewModel.flashMessage ?? "")
        }
        .confirmationDialog(
            "Revoke this invite?",
            isPresented: Binding(
                get: { revokeTargetId != nil },
                set: { if !$0 { revokeTargetId = nil } }
            ),
            titleVisibility: .visible
        ) {
            Button("Revoke invite", role: .destructive) {
                if let id = revokeTargetId {
                    Task { await viewModel.revokePendingInvite(id: id) }
                }
                revokeTargetId = nil
            }
            Button("Cancel", role: .cancel) {
                revokeTargetId = nil
            }
        } message: {
            Text("They won’t be able to use this invite link anymore.")
        }
    }

    private var loadingView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                OperatorListLoadingPlaceholder(
                    title: "Loading customers…",
                    subtitle: "Fetching invites and connected customers.",
                    skeletonCount: 3
                )
            }
            .padding(.horizontal, 20)
            .padding(.top, 24)
        }
    }

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 14) {
            Spacer()
            PFOperatorErrorMoment(
                title: "Customers could not load",
                message: "We could not load your customer list. Try again.",
                technicalMessage: message,
                actionTitle: "Reload customers",
                footerHint: "Pull down to refresh after you fix your connection.",
                onAction: { await viewModel.load() }
            )
            .padding(.horizontal, 20)
            Spacer()
        }
    }

    private var contentList: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: PFOperatorShellMetrics.sectionSpacing) {
                BusinessWorkspaceStrip()
                    .environmentObject(env)

                PFOperatorHero(
                    overline: "Customers",
                    title: "Waiting customers",
                    subtitle: "Invite customers so they can get openings when someone cancels.",
                    showLivePulse: true,
                    uppercaseOverline: false,
                    primaryActionTitle: "Invite customer",
                    primaryAction: { showCreateInvite = true }
                )

                if viewModel.invites.isEmpty {
                    PFOperatorEmptyMoment(
                        systemImage: "person.2",
                        title: "No waiting customers yet",
                        message: "Invite customers by email. They join your list so you can send them openings.",
                        actionTitle: "Invite customer",
                        action: { showCreateInvite = true }
                    )
                } else {
                    section(
                        title: "Pending invites",
                        isEmpty: viewModel.pendingInvites.isEmpty,
                        emptyMessage: "No invites waiting. Tap Invite above to add someone."
                    ) {
                        VStack(spacing: 12) {
                            ForEach(viewModel.pendingInvites) { invite in
                                pendingRow(invite)
                            }
                        }
                    }

                    section(
                        title: "Getting started",
                        isEmpty: viewModel.standbySpotlightInvites.isEmpty,
                        emptyMessage: "No items here yet — new or onboarding customers will show when relevant."
                    ) {
                        VStack(spacing: 12) {
                            ForEach(viewModel.standbySpotlightInvites) { invite in
                                connectedRow(invite, emphasizeOnboarding: true)
                            }
                        }
                    }

                    section(
                        title: "Connected customers",
                        isEmpty: otherConnectedInvites.isEmpty,
                        emptyMessage: "Nobody connected yet. They appear after they accept an invite."
                    ) {
                        VStack(spacing: 12) {
                            ForEach(otherConnectedInvites) { invite in
                                connectedRow(invite, emphasizeOnboarding: false)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, PFOperatorShellMetrics.horizontalPadding)
            .padding(.top, 16)
            .pfOperatorTabBarContentInset()
        }
    }

    /// Connected rows that aren’t already shown under Getting started (by invite id).
    private var otherConnectedInvites: [StaffCustomerInviteListItemDTO] {
        let spotlightIds = Set(viewModel.standbySpotlightInvites.map(\.id))
        return viewModel.connectedInvites.filter { !spotlightIds.contains($0.id) }
    }

    @ViewBuilder
    private func section<Content: View>(
        title: String,
        isEmpty: Bool,
        emptyMessage: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title.uppercased())
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            if isEmpty {
                Text(emptyMessage)
                    .font(.system(size: 14))
                    .foregroundStyle(PFColor.textSecondary)
                    .padding(.vertical, 4)
            } else {
                content()
            }
        }
    }

    private func pendingRow(_ invite: StaffCustomerInviteListItemDTO) -> some View {
        let brief = OperatorSafeCustomerBrief.titleFrom(invite: invite)
        return VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 10) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(brief.title)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(PFColor.textPrimary)
                    inviteSubtitleStack(brief.subtitleLines)

                    Text("Sent \(relativeOrRaw(invite.createdAt))")
                        .font(.system(size: 12))
                        .foregroundStyle(PFColor.textSecondary)
                }
                Spacer(minLength: 0)
            }

            HStack(spacing: 10) {
                if let url = invite.inviteUrl?.trimmingCharacters(in: .whitespacesAndNewlines), !url.isEmpty {
                    Button("Copy link") {
                        PFHaptics.selection()
                        UIPasteboard.general.string = url
                        viewModel.flashMessage = "Invite link copied."
                    }
                    .font(.system(size: 14, weight: .semibold))
                }
                if let code = invite.code?.trimmingCharacters(in: .whitespacesAndNewlines), !code.isEmpty {
                    Button("Copy code") {
                        PFHaptics.selection()
                        UIPasteboard.general.string = code
                        viewModel.flashMessage = "Invite code copied."
                    }
                    .font(.system(size: 14, weight: .semibold))
                }
                Button("Revoke", role: .destructive) {
                    PFHaptics.mediumImpact()
                    revokeTargetId = invite.id
                }
                .font(.system(size: 14, weight: .semibold))
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }

    private func connectedRow(_ invite: StaffCustomerInviteListItemDTO, emphasizeOnboarding: Bool) -> some View {
        let customerId = invite.acceptedByCustomerId ?? ""
        let brief = OperatorSafeCustomerBrief.titleFrom(invite: invite)
        let detailTrimmed = invite.onboardingStatus.detail.trimmingCharacters(in: .whitespacesAndNewlines)
        let emailLine = invite.customerEmail.trimmingCharacters(in: .whitespacesAndNewlines)
        let showEmailUnderTitle = !emailLine.isEmpty && emailLine.caseInsensitiveCompare(brief.title) != .orderedSame
        return VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(brief.title)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(PFColor.textPrimary)

                    if showEmailUnderTitle {
                        Text(emailLine)
                            .font(.system(size: 14))
                            .foregroundStyle(PFColor.textSecondary)
                    }

                    if emphasizeOnboarding {
                        Text(invite.onboardingStatus.label)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(onboardingTone(invite.onboardingStatus.tone))
                        if !detailTrimmed.isEmpty {
                            Text(detailTrimmed)
                                .font(.system(size: 13))
                                .foregroundStyle(PFColor.textSecondary)
                        }
                    } else {
                        Text(invite.onboardingStatus.label)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(PFColor.textSecondary)
                    }
                    if let acceptedAt = invite.acceptedAt {
                        Text("Connected \(relativeOrRaw(acceptedAt))")
                            .font(.system(size: 12))
                            .foregroundStyle(PFColor.textSecondary)
                    }
                }
                Spacer(minLength: 0)
            }

            if !customerId.isEmpty {
                HStack(spacing: 12) {
                    Button {
                        customerPath.append(customerId)
                    } label: {
                        Text("View context")
                            .font(.system(size: 14, weight: .semibold))
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(PFColor.primary)
                }
            } else {
                Text("Waiting for customer record…")
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }

    @ViewBuilder
    private func inviteSubtitleStack(_ lines: [String]) -> some View {
        ForEach(Array(lines.enumerated()), id: \.offset) { _, line in
            Text(line)
                .font(.system(size: 14))
                .foregroundStyle(PFColor.textSecondary)
        }
    }

    private func relativeOrRaw(_ iso: String) -> String {
        guard let d = DateFormatterPF.parseToDate(iso) else { return iso }
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .abbreviated
        return f.localizedString(for: d, relativeTo: Date())
    }

    private func onboardingTone(_ tone: String) -> Color {
        switch tone.lowercased() {
        case "positive", "good", "success":
            return PFColor.primary
        case "warning", "caution":
            return PFColor.warning
        case "negative", "danger":
            return PFColor.error
        default:
            return PFColor.textPrimary
        }
    }
}

// MARK: - Create invite

private struct OperatorCustomerInviteCreateSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var email = ""
    @State private var displayName = ""
    let onSubmit: (_ email: String, _ customerName: String?) -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Email", text: $email)
                        #if os(iOS)
                            .textInputAutocapitalization(.never)
                            .keyboardType(.emailAddress)
                        #endif
                    TextField("Display name (optional)", text: $displayName)
                } header: {
                    Text("Invite")
                } footer: {
                    Text("Pilot invites use email today. SMS or phone-only invites aren’t supported by the API yet.")
                }
            }
            .navigationTitle("New invite")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        let name = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
                        onSubmit(email, name.isEmpty ? nil : name)
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }
}

// MARK: - Copy after create

private struct OperatorInviteCreatedCopySheet: View {
    let invite: StaffCustomerInviteListItemDTO
    let onDone: () -> Void

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Invite ready")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(PFColor.textPrimary)
                    Text("Copy a link or code to send to \(invite.customerEmail).")
                        .font(.system(size: 15))
                        .foregroundStyle(PFColor.textSecondary)

                    if let url = invite.inviteUrl?.trimmingCharacters(in: .whitespacesAndNewlines), !url.isEmpty {
                        copyBlock(title: "Invite link", value: url)
                    }
                    if let code = invite.code?.trimmingCharacters(in: .whitespacesAndNewlines), !code.isEmpty {
                        copyBlock(title: "Invite code", value: code)
                    }
                    if let tok = invite.oneTimeToken?.trimmingCharacters(in: .whitespacesAndNewlines), !tok.isEmpty {
                        copyBlock(title: "One-time token", value: tok)
                    }

                    if (invite.inviteUrl == nil || invite.inviteUrl?.isEmpty == true),
                       (invite.code == nil || invite.code?.isEmpty == true),
                       (invite.oneTimeToken == nil || invite.oneTimeToken?.isEmpty == true) {
                        Text("Invite is saved. If no link or token appears below, reopen Customers after a refresh — your workspace may email the guest directly.")
                            .font(.system(size: 14))
                            .foregroundStyle(PFColor.textSecondary)
                    }
                }
                .padding(22)
            }
            .background(PFScreenBackground().ignoresSafeArea())
            .navigationTitle("Share invite")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        onDone()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }

    private func copyBlock(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased())
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)
            Text(value)
                .font(.system(size: 14))
                .foregroundStyle(PFColor.textPrimary)
                .textSelection(.enabled)
            Button("Copy") {
                UIPasteboard.general.string = value
            }
            .buttonStyle(.borderedProminent)
            .tint(PFColor.primary)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }
}
