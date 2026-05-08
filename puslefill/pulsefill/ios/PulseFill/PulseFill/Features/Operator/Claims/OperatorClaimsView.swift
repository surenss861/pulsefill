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
            .background(PFScreenBackground().ignoresSafeArea())
            .navigationTitle("Claims")
            .navigationBarTitleDisplayMode(.inline)
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
            Button("Try again") {
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
        "This marks the spot as booked for the customer who claimed it."
    }

    private var loadingView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                OperatorListLoadingPlaceholder(
                    title: "Loading claims…",
                    subtitle: "Finding openings where someone claimed a spot.",
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
                title: "Claims could not load",
                message: "We could not load claims. Try again or pull down to refresh.",
                technicalMessage: message,
                retryButtonTitle: "Reload claims",
                footerHint: "Openings and Today still work from the other tabs.",
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

                PFOperatorHero(
                    overline: "Confirm",
                    title: "Customer claims",
                    subtitle: "Someone claimed an opening? Confirm the booking so the slot counts as filled."
                )

                OperatorClaimsOverviewStrip(
                    needsConfirmationCount: viewModel.needsConfirmationCount,
                    recentlyConfirmedCount: viewModel.recentlyConfirmedCount,
                    closedCount: viewModel.closedCount
                )

                claimsSection(
                    title: "Needs confirmation",
                    subtitle: "A customer wants this spot. Confirm the booking here.",
                    items: viewModel.needsConfirmation,
                    showConfirmPrimary: true,
                    emptySystemImage: "checkmark.seal",
                    emptyTitle: "No claims waiting",
                    emptyMessage: "When a customer claims an opening, it appears here. Post openings from the Create tab."
                )

                claimsSection(
                    title: "Recently confirmed",
                    subtitle: "Openings you already confirmed.",
                    items: viewModel.recentlyConfirmed,
                    showConfirmPrimary: false,
                    emptySystemImage: "calendar.badge.checkmark",
                    emptyTitle: "No recent confirmations",
                    emptyMessage: "Confirmed bookings will show up here."
                )

                claimsSection(
                    title: "Finished",
                    subtitle: "Expired, cancelled, or otherwise done.",
                    items: viewModel.closed,
                    showConfirmPrimary: false,
                    emptySystemImage: "archivebox",
                    emptyTitle: "Nothing finished yet",
                    emptyMessage: "Older openings that are done will show here for reference."
                )
            }
            .padding(.top, 16)
            .padding(.horizontal, 20)
            .pfOperatorTabBarContentInset()
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
        PFOperatorMetricStrip {
            metricCell(title: "Needs confirmation", value: "\(needsConfirmationCount)", emphasis: needsConfirmationCount > 0)
            Divider().overlay(PFColor.hairline)
            metricCell(title: "Confirmed", value: "\(recentlyConfirmedCount)")
            Divider().overlay(PFColor.hairline)
            metricCell(title: "Finished", value: "\(closedCount)")
        }
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
