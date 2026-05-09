import SwiftUI

/// Mobile-first operator home for Business mode — recovery signal, queue pressure, quick actions, recent openings.
struct BusinessTodayView: View {
    @EnvironmentObject private var env: AppEnvironment
    @Binding var selectedTab: BusinessShellTab
    /// Jump to **More** tab and open customers or account.
    var onNavigateMore: (BusinessMoreRoute) -> Void

    @StateObject private var viewModel: BusinessTodayViewModel
    @State private var slotPath = NavigationPath()

    init(
        businessAPI: BusinessOperatorAPIClient,
        selectedTab: Binding<BusinessShellTab>,
        onNavigateMore: @escaping (BusinessMoreRoute) -> Void = { _ in }
    ) {
        _selectedTab = selectedTab
        self.onNavigateMore = onNavigateMore
        _viewModel = StateObject(wrappedValue: BusinessTodayViewModel(businessAPI: businessAPI))
    }

    var body: some View {
        NavigationStack(path: $slotPath) {
            Group {
                if case let .failed(message) = viewModel.loadState,
                   viewModel.dailySummary == nil,
                   viewModel.queueResponse == nil {
                    errorView(message)
                } else if viewModel.dailySummary == nil && viewModel.queueResponse == nil {
                    loadingView
                } else {
                    contentScroll
                }
            }
            .background(PFScreenBackground())
            .navigationTitle("Today")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(PFColor.surface1, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .navigationDestination(for: String.self) { slotId in
                OperatorSlotDetailView(businessAPI: env.businessOperatorAPI, slotId: slotId)
            }
            .task { await viewModel.load() }
            .refreshable { await viewModel.refresh() }
        }
    }

    private var loadingView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                OperatorListLoadingPlaceholder(
                    title: "Loading Today…",
                    subtitle: "Getting your recovery summary and latest openings.",
                    skeletonCount: 3
                )
            }
            .padding(.horizontal, 20)
            .padding(.top, 24)
        }
    }

    private func errorView(_ message: String) -> some View {
        VStack {
            Spacer()
            PFOperatorErrorMoment(
                title: "Today could not load",
                message: "We could not get your recovery tasks. Try again.",
                technicalMessage: message,
                actionTitle: "Reload Today",
                footerHint: "Openings and claims still work from the tabs below.",
                onAction: { await viewModel.load() }
            )
            .padding(.horizontal, 20)
            Spacer()
        }
    }

    private var contentScroll: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: PFOperatorShellMetrics.sectionSpacing) {
                BusinessWorkspaceStrip()
                    .environmentObject(env)

                PFOperatorHero(
                    overline: "Overview",
                    title: "What needs you",
                    subtitle: "Add an empty appointment. PulseFill sends offers to waiting customers. You confirm the claim.",
                    primaryActionTitle: "Add opening",
                    primaryAction: { selectedTab = .create }
                )

                if let daily = viewModel.dailySummary, let summary = viewModel.queueSummary {
                    recoveryHealthCard(
                        server: viewModel.recoveryHealth,
                        metrics: daily.metrics,
                        summary: summary,
                        nextStep: viewModel.firstNeedsActionItem
                    )
                }

                if let summary = viewModel.queueSummary {
                    needsActionCard(summary: summary)
                }

                quickActions

                recentOpeningsSection

                if isQuietDay, let daily = viewModel.dailySummary {
                    quietDayCallout(metrics: daily.metrics)
                }
            }
            .padding(.horizontal, PFOperatorShellMetrics.horizontalPadding)
            .padding(.top, 16)
            .pfOperatorTabBarContentInset()
        }
    }

    private func recoveryHealthCard(
        server: OperatorRecoveryHealthResponse?,
        metrics: OperatorDailyOpsMetrics,
        summary: OperatorActionQueueSummary,
        nextStep: OperatorActionQueueItem?
    ) -> some View {
        let snap = BusinessTodayRecoveryHealthSnapshot(
            server: server,
            metrics: metrics,
            summary: summary,
            nextStep: nextStep
        )
        return PFCustomerSectionCard(variant: .attention, padding: 18) {
            VStack(alignment: .leading, spacing: 12) {
                Text("Today’s recovery")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(PFColor.textSecondary)
                    .textCase(.uppercase)
                    .tracking(0.6)

                HStack(spacing: 8) {
                    PFStatusPill(text: snap.statusLabel, variant: snap.statusVariant)
                    Spacer(minLength: 0)
                }

                Text(snap.headline)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)
                    .fixedSize(horizontal: false, vertical: true)

                Text(snap.message)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)

                if let fix = snap.topFix {
                    Text(fix)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(PFColor.primaryText)
                        .padding(.top, 4)
                }

                HStack(spacing: 10) {
                    compactMetric("\(metrics.recoveredBookingsToday)", label: "Recovered")
                    compactMetric("\(metrics.activeOfferedSlotsCount)", label: "Active")
                    compactMetric("\(metrics.noMatchesToday)", label: "No taker")
                }
                .padding(.top, 4)
            }
        }
    }

    private func compactMetric(_ value: String, label: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value)
                .font(.system(size: 17, weight: .bold))
                .foregroundStyle(PFColor.textPrimary)
            Text(label)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(PFColor.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func needsActionCard(summary: OperatorActionQueueSummary) -> some View {
        PFCustomerSectionCard(variant: .quiet, padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                Text("Tasks")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)

                needsActionRow(count: summary.awaitingConfirmationCount, title: "Claims waiting on you", subtitle: "Confirm the booking before it times out.")
                needsActionRow(count: summary.needsActionCount, title: "Openings need a step", subtitle: "Send offers, follow up, or fix delivery.")
                needsActionRow(count: summary.retryRecommendedCount, title: "Try sending offers again", subtitle: "Reach more waiting customers or resend.")

                if summary.deliveryFailedCount > 0 {
                    needsActionRow(count: summary.deliveryFailedCount, title: "Could not reach customer", subtitle: "Retry text or push if it failed.", emphasize: true)
                }
            }
        }
    }

    private func needsActionRow(count: Int, title: String, subtitle: String, emphasize: Bool = false) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(count)")
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(emphasize ? PFColor.error : PFColor.primaryText)
                .frame(minWidth: 36, alignment: .leading)
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)
                Text(subtitle)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(2)
            }
            Spacer(minLength: 0)
        }
    }

    private var quickActions: some View {
        PFCustomerSectionCard(variant: .default, padding: 18) {
            VStack(alignment: .leading, spacing: 12) {
                Text("What’s next")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)

                PFCustomerPrimaryButton(title: "Create opening") {
                    selectedTab = .create
                }
                PFCustomerSecondaryButton(title: "View claims") {
                    selectedTab = .claims
                }
                PFCustomerSecondaryButton(title: "Invite customer") {
                    onNavigateMore(.customers)
                }
            }
        }
    }

    private var recentOpeningsSection: some View {
        PFCustomerSectionCard(variant: .quiet, padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Text("Recent openings")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(PFColor.textPrimary)
                    Spacer()
                    Button("View all openings") {
                        selectedTab = .openings
                    }
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(PFColor.ember)
                }

                if viewModel.recentOpenings.isEmpty {
                    PFOperatorEmptyMoment(
                        systemImage: "calendar.badge.plus",
                        title: "No openings yet",
                        message: "Add an empty appointment so PulseFill can offer it to waiting customers.",
                        actionTitle: "Add opening",
                        action: { selectedTab = .create }
                    )
                } else {
                    VStack(spacing: 10) {
                        ForEach(viewModel.recentOpenings) { slot in
                            Button {
                                slotPath.append(slot.id)
                            } label: {
                                recentOpeningRow(slot)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
        }
    }

    private func recentOpeningRow(_ slot: StaffOpenSlotListRow) -> some View {
        HStack(alignment: .center, spacing: 12) {
            StatusChipView(operatorOpeningStatus: slot.status)
            VStack(alignment: .leading, spacing: 4) {
                Text(slotTitle(slot))
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)
                    .lineLimit(2)
                Text(DateFormatterPF.dateTimeRange(start: slot.startsAt, end: slot.endsAt))
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
            }
            Spacer(minLength: 0)
            Image(systemName: "chevron.right")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary.opacity(0.7))
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(PFColor.customerCard.opacity(0.55))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(PFColor.hairline, lineWidth: 1)
        )
    }

    private func slotTitle(_ slot: StaffOpenSlotListRow) -> String {
        let trimmed = slot.providerNameSnapshot?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? "Opening" : trimmed
    }

    private var isQuietDay: Bool {
        guard let summary = viewModel.queueSummary,
              let metrics = viewModel.dailySummary?.metrics else { return false }
        return summary.needsActionCount == 0
            && summary.awaitingConfirmationCount == 0
            && summary.retryRecommendedCount == 0
            && summary.deliveryFailedCount == 0
            && metrics.activeOfferedSlotsCount == 0
            && viewModel.recentOpenings.isEmpty
    }

    private func quietDayCallout(metrics: OperatorDailyOpsMetrics) -> some View {
        PFCustomerInfoCallout(
            title: "All quiet right now",
            message:
                metrics.recoveredBookingsToday > 0
                    ? "Nothing urgent in the queue. You filled \(metrics.recoveredBookingsToday) empty appointment\(metrics.recoveredBookingsToday == 1 ? "" : "s") today — nice work."
                    : "When you add openings, tasks will show up here. Openings and Claims still work from the tabs below.",
            variant: .neutral
        )
    }
}

// MARK: - Recovery health (server `recovery-health` when present, else synthesized from daily + queue)

private struct BusinessTodayRecoveryHealthSnapshot {
    let statusLabel: String
    let statusVariant: PFStatusPill.Variant
    let headline: String
    let message: String
    let topFix: String?

    init(
        server: OperatorRecoveryHealthResponse?,
        metrics: OperatorDailyOpsMetrics,
        summary: OperatorActionQueueSummary,
        nextStep: OperatorActionQueueItem?
    ) {
        if let server, server.isUsableForDisplay {
            let h = (server.headline ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            let m = (server.message ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            headline = h
            message = m
            let trimmedFix = server.topFix?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            topFix = trimmedFix.isEmpty ? nextStep.map { "Next: \($0.headline)" } : trimmedFix

            if let raw = server.status?.trimmingCharacters(in: .whitespacesAndNewlines), !raw.isEmpty {
                statusLabel = Self.presentableStatusLabel(raw)
                statusVariant = Self.variant(forStatus: raw)
            } else {
                let syn = Self.synthesized(metrics: metrics, summary: summary, nextStep: nextStep)
                statusLabel = syn.statusLabel
                statusVariant = syn.statusVariant
            }
        } else {
            let syn = Self.synthesized(metrics: metrics, summary: summary, nextStep: nextStep)
            statusLabel = syn.statusLabel
            statusVariant = syn.statusVariant
            headline = syn.headline
            message = syn.message
            topFix = syn.topFix
        }
    }

    private static func presentableStatusLabel(_ raw: String) -> String {
        raw
            .split(separator: "_")
            .map { $0.capitalized }
            .joined(separator: " ")
    }

    private static func variant(forStatus raw: String) -> PFStatusPill.Variant {
        let s = raw.lowercased()
        if s.contains("critical") || s.contains("blocked") || s.contains("failing") || s.contains("danger") {
            return .danger
        }
        if s.contains("warn") || s.contains("attention") || s.contains("watch") || s.contains("motion") {
            return .warning
        }
        if s.contains("healthy") || s.contains("good") || s.contains("steady") || s.contains("ok") {
            return .success
        }
        return .primary
    }

    private static func synthesized(
        metrics: OperatorDailyOpsMetrics,
        summary: OperatorActionQueueSummary,
        nextStep: OperatorActionQueueItem?
    ) -> BusinessTodayRecoveryHealthSnapshot {
        let pressure = summary.needsActionCount + summary.deliveryFailedCount + summary.retryRecommendedCount
        let awaiting = summary.awaitingConfirmationCount

        if summary.deliveryFailedCount > 0 || summary.needsActionCount >= 4 {
            return BusinessTodayRecoveryHealthSnapshot(
                statusLabel: "Needs focus",
                statusVariant: .danger,
                headline: "Recovery is backing up",
                message:
                    "A few openings need you — confirm a booking, send offers again, or fix a text that didn’t go through.",
                topFix: nextStep.map { "Next: \($0.headline)" }
            )
        }
        if pressure > 0 || awaiting > 0 {
            return BusinessTodayRecoveryHealthSnapshot(
                statusLabel: "In motion",
                statusVariant: .warning,
                headline: "There’s work in the queue",
                message:
                    "You have openings waiting on a confirm, offers, or a resend. Clearing these keeps customers moving.",
                topFix: nextStep.map { "Next: \($0.headline)" }
            )
        }
        if metrics.noMatchesToday > 0 {
            return BusinessTodayRecoveryHealthSnapshot(
                statusLabel: "Watch no-matches",
                statusVariant: .warning,
                headline: "Some slots didn’t match standby",
                message:
                    "Some openings had no waiting customers. Check timing, service, or who’s on your standby list.",
                topFix: nextStep.map { "Next: \($0.headline)" }
            )
        }
        return BusinessTodayRecoveryHealthSnapshot(
            statusLabel: "Healthy",
            statusVariant: .success,
            headline: "Recovery looks steady",
            message:
                "Nothing urgent right now. When someone cancels, add the empty appointment so PulseFill can offer it to waiting customers.",
            topFix: nextStep.map { "Suggested: \($0.headline)" }
        )
    }

    private init(statusLabel: String, statusVariant: PFStatusPill.Variant, headline: String, message: String, topFix: String?) {
        self.statusLabel = statusLabel
        self.statusVariant = statusVariant
        self.headline = headline
        self.message = message
        self.topFix = topFix
    }
}
