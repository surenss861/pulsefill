import SwiftUI

/// Mobile-first operator home for Business mode — recovery signal, queue pressure, quick actions, recent openings.
struct BusinessTodayView: View {
    @EnvironmentObject private var env: AppEnvironment
    @Binding var selectedTab: BusinessShellTab

    @StateObject private var viewModel: BusinessTodayViewModel
    @State private var slotPath = NavigationPath()

    init(businessAPI: BusinessOperatorAPIClient, selectedTab: Binding<BusinessShellTab>) {
        _selectedTab = selectedTab
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
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
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
                    subtitle: "Pulling recovery health, queue, and latest openings.",
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
            OperatorErrorStateCard(
                title: "Couldn’t load Today",
                message: "Refresh and try again. Your connection or the server may have hiccuped.",
                technicalMessage: message,
                onRetry: { await viewModel.load() }
            )
            .padding(.horizontal, 20)
            Spacer()
        }
    }

    private var contentScroll: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                BusinessWorkspaceStrip()
                    .environmentObject(env)

                workspaceHeader

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
            .padding(.horizontal, 20)
            .padding(.top, 12)
            .padding(.bottom, 32)
        }
    }

    private var workspaceHeader: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Today")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)
                .textCase(.uppercase)
                .tracking(0.6)

            Text("Recover openings and keep your standby pool moving.")
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(PFColor.textSecondary)
                .lineSpacing(3)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
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
                Text("Recovery health")
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
                    compactMetric("\(metrics.noMatchesToday)", label: "No match")
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
                Text("Needs action")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)

                needsActionRow(count: summary.awaitingConfirmationCount, title: "Claims waiting on you", subtitle: "Confirm bookings before they time out.")
                needsActionRow(count: summary.needsActionCount, title: "Openings needing attention", subtitle: "Offers, delivery, or follow-up.")
                needsActionRow(count: summary.retryRecommendedCount, title: "Retry offers suggested", subtitle: "Widen standby reach or resend.")

                if summary.deliveryFailedCount > 0 {
                    needsActionRow(count: summary.deliveryFailedCount, title: "Delivery issues", subtitle: "Push or SMS may need a retry.", emphasize: true)
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
                Text("Quick actions")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)

                PFCustomerPrimaryButton(title: "Create opening") {
                    selectedTab = .create
                }
                PFCustomerSecondaryButton(title: "Review claims") {
                    selectedTab = .claims
                }
                PFCustomerSecondaryButton(title: "Invite customer") {
                    selectedTab = .customers
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
                    Button("See all") {
                        selectedTab = .openings
                    }
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(PFColor.ember)
                }

                if viewModel.recentOpenings.isEmpty {
                    OperatorEmptyStateCard(
                        systemImage: "calendar.badge.plus",
                        title: "No openings posted",
                        message: "Post a cancellation opening so standby customers can receive offers.",
                        primaryButtonTitle: "Create opening",
                        primaryAction: { selectedTab = .create }
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
                    ? "No urgent queue items. You’ve recovered \(metrics.recoveredBookingsToday) booking\(metrics.recoveredBookingsToday == 1 ? "" : "s") today — nice work."
                    : "When you publish openings, queue items and previews will show up here. You can still use Openings and Claims anytime.",
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
                    "Several openings need attention — confirmations, retries, or delivery. Work the queue to keep standby customers from stalling.",
                topFix: nextStep.map { "Next: \($0.headline)" }
            )
        }
        if pressure > 0 || awaiting > 0 {
            return BusinessTodayRecoveryHealthSnapshot(
                statusLabel: "In motion",
                statusVariant: .warning,
                headline: "There’s work in the queue",
                message:
                    "You have items waiting on confirmations, offers, or retries. Clearing these keeps your pool healthy.",
                topFix: nextStep.map { "Next: \($0.headline)" }
            )
        }
        if metrics.noMatchesToday > 0 {
            return BusinessTodayRecoveryHealthSnapshot(
                statusLabel: "Watch no-matches",
                statusVariant: .warning,
                headline: "Some slots didn’t match standby",
                message:
                    "Review no-match openings to adjust timing, services, or standby coverage.",
                topFix: nextStep.map { "Next: \($0.headline)" }
            )
        }
        return BusinessTodayRecoveryHealthSnapshot(
            statusLabel: "Healthy",
            statusVariant: .success,
            headline: "Recovery looks steady",
            message:
                "No urgent queue pressure right now. Keep publishing openings when cancellations land so standby can fill them.",
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
