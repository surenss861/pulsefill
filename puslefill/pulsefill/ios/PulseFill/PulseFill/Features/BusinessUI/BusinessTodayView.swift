import SwiftUI

/// Mobile-first **Business Today** — openings, offers, and confirmations at a glance.
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
                    subtitle: "Getting your openings summary and what needs you next.",
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
                message: "We couldn’t load your Today screen. Try again.",
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
                    overline: "Today",
                    title: "What needs you",
                    subtitle: "Add openings, send offers, and confirm bookings.",
                    showLivePulse: true,
                    uppercaseOverline: false,
                    primaryActionTitle: "Add opening",
                    primaryAction: { selectedTab = .create }
                )

                if viewModel.pendingStandbyRequestCount > 0 {
                    waitlistRequestsSurface
                }

                if let daily = viewModel.dailySummary, let summary = viewModel.queueSummary {
                    recoveryHealthCard(
                        server: viewModel.recoveryHealth,
                        metrics: daily.metrics,
                        summary: summary,
                        nextStep: viewModel.firstNeedsActionItem
                    )
                }

                if let summary = viewModel.queueSummary {
                    needsActionCard(summary: summary, waitlistCount: viewModel.pendingStandbyRequestCount)
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
                Text("How today looks")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(PFColor.textSecondary)
                    .textCase(.none)
                    .tracking(0.2)

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
                    compactMetric("\(metrics.recoveredBookingsToday)", label: "Bookings confirmed")
                    compactMetric("\(metrics.activeOfferedSlotsCount)", label: "Offers out")
                    compactMetric("\(metrics.noMatchesToday)", label: "No match yet")
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

    private var waitlistRequestsSurface: some View {
        PFCustomerSectionCard(variant: .attention, padding: 18) {
            VStack(alignment: .leading, spacing: 12) {
                Text("Waitlist requests")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)

                Text(
                    viewModel.pendingStandbyRequestCount == 1
                        ? "1 customer asked to join your waiting list."
                        : "\(viewModel.pendingStandbyRequestCount) customers asked to join your waiting list."
                )
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(PFColor.textSecondary)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)

                PFCustomerPrimaryButton(title: "Review requests") {
                    PFHaptics.mediumImpact()
                    onNavigateMore(.customers)
                }
            }
        }
    }

    private func needsActionCard(summary: OperatorActionQueueSummary, waitlistCount: Int) -> some View {
        PFCustomerSectionCard(variant: .quiet, padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                Text("Next steps")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)

                if waitlistCount > 0 {
                    VStack(alignment: .leading, spacing: 10) {
                        needsActionRow(
                            count: waitlistCount,
                            title: "Waitlist requests",
                            subtitle: "Approve or decline customers who asked to join your waiting list.",
                            emphasize: false
                        )
                        Button {
                            PFHaptics.selection()
                            onNavigateMore(.customers)
                        } label: {
                            Text("Review requests")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(PFColor.ember)
                        }
                        .buttonStyle(.plain)
                    }
                }

                needsActionRow(count: summary.awaitingConfirmationCount, title: "Customer claims", subtitle: "Confirm the booking before it times out.")
                needsActionRow(count: summary.needsActionCount, title: "Openings need you", subtitle: "Send offers again or fix delivery so customers see the opening.")
                needsActionRow(count: summary.retryRecommendedCount, title: "Retry sending offers", subtitle: "Reach more waiting customers with another send.")

                if summary.deliveryFailedCount > 0 {
                    needsActionRow(count: summary.deliveryFailedCount, title: "Could not reach customer", subtitle: "Retry text or push if delivery failed.", emphasize: true)
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

                PFCustomerPrimaryButton(title: "Add opening") {
                    selectedTab = .create
                }
                PFCustomerSecondaryButton(title: "Send offers") {
                    selectedTab = .openings
                }
                PFCustomerSecondaryButton(title: "Customer claims") {
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
                    ? "Nothing urgent on Today. You confirmed \(metrics.recoveredBookingsToday) booking\(metrics.recoveredBookingsToday == 1 ? "" : "s") so far — nice work."
                    : "When you add openings, next steps show up here. Openings and Claims still work from the tabs below.",
            variant: .neutral
        )
    }
}

// MARK: - Today health snapshot (server `recovery-health` when present, else synthesized from daily + queue)

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
                headline: "A few openings need you",
                message:
                    "Confirm a booking, send offers again, or fix a message that didn’t go through.",
                topFix: nextStep.map { "Next: \($0.headline)" }
            )
        }
        if pressure > 0 || awaiting > 0 {
            return BusinessTodayRecoveryHealthSnapshot(
                statusLabel: "In motion",
                statusVariant: .warning,
                headline: "There’s work on your desk",
                message:
                    "You have openings waiting on a confirm, offers, or a resend. Clearing these keeps customers moving.",
                topFix: nextStep.map { "Next: \($0.headline)" }
            )
        }
        if metrics.noMatchesToday > 0 {
            return BusinessTodayRecoveryHealthSnapshot(
                statusLabel: "Worth a look",
                statusVariant: .warning,
                headline: "Some openings had no takers",
                message:
                    "Check timing, service, or who’s on your waiting list so the next opening matches someone.",
                topFix: nextStep.map { "Next: \($0.headline)" }
            )
        }
        return BusinessTodayRecoveryHealthSnapshot(
            statusLabel: "On track",
            statusVariant: .success,
            headline: "Today looks steady",
            message:
                "Nothing urgent right now. When someone cancels, add the opening so PulseFill can offer it to waiting customers.",
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
