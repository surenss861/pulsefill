import SwiftUI

struct OperatorClaimsView: View {
    @EnvironmentObject private var env: AppEnvironment
    @StateObject private var viewModel: OperatorClaimsViewModel
    @State private var path = NavigationPath()
    @State private var itemPendingConfirmBooking: OperatorClaimListItem?

    init(businessAPI: BusinessOperatorAPIClient) {
        _viewModel = StateObject(wrappedValue: OperatorClaimsViewModel(businessAPI: businessAPI))
    }

    var body: some View {
        NavigationStack(path: $path) {
            Group {
                if case let .failed(msg) = viewModel.loadState, !viewModel.didLoadOnce {
                    errorView(msg)
                } else if !viewModel.didLoadOnce, viewModel.loadState == .loading {
                    loadingView
                } else {
                    contentScroll
                }
            }
            .background(PFColor.background.ignoresSafeArea())
            .navigationTitle("Claims")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(PFColor.surface1, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .navigationDestination(for: String.self) { slotId in
                OperatorSlotDetailView(businessAPI: env.businessOperatorAPI, slotId: slotId)
            }
        }
        .task {
            await viewModel.load()
        }
        .refreshable {
            await viewModel.refresh()
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
        .alert("Couldn’t confirm booking", isPresented: Binding(
            get: { viewModel.confirmFailurePrompt != nil },
            set: { if !$0 { viewModel.clearConfirmFailure() } }
        ), actions: {
            Button("Retry") {
                Task { await viewModel.retryFailedConfirmation() }
            }
            Button("OK", role: .cancel) {
                viewModel.clearConfirmFailure()
            }
        }, message: {
            Text("Refresh the opening and try again.")
        })
        .confirmationDialog(
            "Confirm booking?",
            isPresented: Binding(
                get: { itemPendingConfirmBooking != nil },
                set: { if !$0 { itemPendingConfirmBooking = nil } }
            ),
            titleVisibility: .visible
        ) {
            bookingConfirmActions
        } message: {
            Text(bookingConfirmationMessage)
        }
    }

    /// Split out so SwiftUI type-check can stay fast.
    @ViewBuilder
    private var bookingConfirmActions: some View {
        Button("Confirm booking") {
            let item = itemPendingConfirmBooking
            itemPendingConfirmBooking = nil
            if let item {
                Task { await viewModel.confirmBooking(item) }
            }
        }
        Button("Cancel", role: .cancel) {
            itemPendingConfirmBooking = nil
        }
    }

    private var bookingConfirmationMessage: String {
        "This marks the opening as booked. The standby customer who claimed it will be treated as confirmed for this appointment."
    }

    private var loadingView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                OperatorListLoadingPlaceholder(
                    title: "Loading claims…",
                    subtitle: "Fetching openings with standby claims.",
                    skeletonCount: 3
                )
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
        }
    }

    private func errorView(_ message: String) -> some View {
        VStack {
            Spacer()
            OperatorErrorStateCard(
                title: "Couldn’t load claims",
                message: "Pull to refresh or try again.",
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

                headerBlock

                OperatorClaimsOverviewStrip(
                    needsConfirmationCount: viewModel.needsConfirmationCount,
                    recentlyConfirmedCount: viewModel.recentlyConfirmedCount,
                    closedCount: viewModel.closedCount
                )

                claimsSection(
                    title: "Needs confirmation",
                    subtitle: "Someone claimed — confirm booking so PulseFill counts the recovery.",
                    items: viewModel.needsConfirmation,
                    showConfirmPrimary: true,
                    emptySystemImage: "checkmark.seal",
                    emptyTitle: "No claims waiting",
                    emptyMessage: "When a standby customer claims an opening, it will appear here for you to confirm."
                )

                claimsSection(
                    title: "Recently confirmed",
                    subtitle: "Recovered bookings tied to standby claims.",
                    items: viewModel.recentlyConfirmed,
                    showConfirmPrimary: false,
                    emptySystemImage: "calendar.badge.checkmark",
                    emptyTitle: "No recent confirmations",
                    emptyMessage: "Confirmed recoveries from standby claims will land in this list."
                )

                claimsSection(
                    title: "Closed",
                    subtitle: "Lost races, cancellations, expiry, or other terminal states.",
                    items: viewModel.closed,
                    showConfirmPrimary: false,
                    emptySystemImage: "archivebox",
                    emptyTitle: "No closed outcomes yet",
                    emptyMessage: "Expired, cancelled, or otherwise finished openings show here for reference."
                )
            }
            .padding(.top, 16)
            .padding(.horizontal, 20)
            .padding(.bottom, 28)
        }
    }

    private var headerBlock: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recoveries")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)
                .textCase(.uppercase)
                .tracking(0.6)
            Text("Claims awaiting you")
                .font(.system(size: 26, weight: .bold))
                .foregroundStyle(PFColor.textPrimary)
            Text("Stay on top of customer claims until every opening is recovered or cleanly closed.")
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(PFColor.textSecondary)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func claimsSection(
        title: String,
        subtitle: String?,
        items: [OperatorClaimListItem],
        showConfirmPrimary: Bool,
        emptySystemImage: String,
        emptyTitle: String,
        emptyMessage: String
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            OperatorClaimsSectionHeader(title: title, subtitle: subtitle)

            if items.isEmpty {
                OperatorEmptyStateCard(
                    systemImage: emptySystemImage,
                    title: emptyTitle,
                    message: emptyMessage,
                    primaryButtonTitle: nil,
                    primaryAction: nil
                )
            } else {
                VStack(spacing: 12) {
                    ForEach(items) { item in
                        OperatorClaimCard(
                            item: item,
                            customerLineDisplay: viewModel.hydratedCustomerLine(for: item),
                            isConfirming: viewModel.confirmingClaimId == item.claimId,
                            showConfirmPrimary: showConfirmPrimary,
                            onRequestConfirm: {
                                itemPendingConfirmBooking = item
                            },
                            onOpenDetail: {
                                path.append(item.openSlotId)
                            }
                        )
                    }
                }
            }
        }
    }
}

// MARK: - Section chrome

private struct OperatorClaimsOverviewStrip: View {
    let needsConfirmationCount: Int
    let recentlyConfirmedCount: Int
    let closedCount: Int

    var body: some View {
        HStack(spacing: 0) {
            metricCell(title: "Needs confirmation", value: "\(needsConfirmationCount)", emphasis: needsConfirmationCount > 0)
            Divider().overlay(PFColor.hairline)
            metricCell(title: "Confirmed", value: "\(recentlyConfirmedCount)")
            Divider().overlay(PFColor.hairline)
            metricCell(title: "Closed", value: "\(closedCount)")
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 8)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .stroke(PFColor.textSecondary.opacity(0.14), lineWidth: 1)
        )
    }

    private func metricCell(title: String, value: String, emphasis: Bool = false) -> some View {
        VStack(alignment: .center, spacing: 4) {
            Text(value)
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(emphasis ? PFColor.warning : PFColor.textPrimary)
            Text(title)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }
}

private struct OperatorClaimsSectionHeader: View {
    let title: String
    let subtitle: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)
            if let subtitle {
                Text(subtitle)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.top, 4)
    }
}
