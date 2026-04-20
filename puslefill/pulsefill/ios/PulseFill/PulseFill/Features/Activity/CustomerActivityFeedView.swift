import SwiftUI

struct CustomerActivityFeedView: View {
    @EnvironmentObject private var env: AppEnvironment
    @State private var viewModel: CustomerActivityFeedViewModel
    @State private var path = NavigationPath()

    init(api: APIClient) {
        _viewModel = State(initialValue: CustomerActivityFeedViewModel(api: api))
    }

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                PFColor.background.ignoresSafeArea()
                Group {
                    switch viewModel.loadState {
                    case .idle, .loading:
                        ProgressView("Loading activity…")
                            .tint(PFColor.primary)

                    case let .failed(message):
                        EmptyStateView(
                            title: "Couldn’t load activity",
                            message: message,
                            actionTitle: "Retry",
                            action: { Task { await viewModel.load() } }
                        )

                    case .loaded:
                        ScrollView {
                            VStack(alignment: .leading, spacing: 16) {
                                CustomerActivityFilterBar(selected: $viewModel.selectedFilter)
                                    .padding(.horizontal, 20)

                                if viewModel.filteredItems.isEmpty {
                                    Text("No recent activity yet.")
                                        .font(.system(size: 13))
                                        .foregroundStyle(PFColor.textSecondary)
                                        .padding(.horizontal, 20)
                                        .padding(.top, 8)
                                } else {
                                    LazyVStack(spacing: 12) {
                                        ForEach(viewModel.filteredItems) { item in
                                            Button {
                                                if let dest = CustomerRouteMapper.destinationForActivityItem(item) {
                                                    path.append(dest)
                                                }
                                            } label: {
                                                CustomerActivityCard(item: item)
                                            }
                                            .buttonStyle(.plain)
                                        }
                                    }
                                    .padding(.horizontal, 20)
                                    .padding(.bottom, 24)
                                }
                            }
                            .padding(.top, 16)
                        }
                        .refreshable { await viewModel.refresh() }
                    }
                }
            }
            .navigationTitle("Activity")
            .toolbarBackground(PFColor.surface1, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .task {
                await viewModel.load()
                consumePendingRoute()
            }
            .onChange(of: env.customerNavigation.pendingCustomerDestination) { _, _ in
                consumePendingRoute()
            }
            .onChange(of: env.customerNavigation.selectedTab) { _, tab in
                if tab == .activity {
                    consumePendingRoute()
                }
            }
            .navigationDestination(for: CustomerDestination.self) { destination in
                destinationView(for: destination)
            }
        }
    }

    @ViewBuilder
    private func destinationView(for destination: CustomerDestination) -> some View {
        switch destination {
        case let .offerDetail(offerId):
            OfferDetailView(api: env.apiClient, offerId: offerId)

        case let .claimOutcome(claimId):
            ClaimOutcomeView(api: env.apiClient, claimId: claimId)

        case .missedOpportunities:
            MissedOpportunitiesView(api: env.apiClient)

        case .standbyStatus:
            StandbyStatusView(api: env.apiClient)

        case .notificationSettings:
            NotificationPreferencesView(api: env.apiClient)

        case .activity:
            Text("Activity")
                .foregroundStyle(PFColor.textSecondary)
        }
    }

    private func consumePendingRoute() {
        guard env.customerNavigation.selectedTab == .activity else { return }
        if let destination = env.customerNavigation.takePendingDestination(matching: {
            switch $0 {
            case .claimOutcome, .activity:
                return true
            default:
                return false
            }
        }) {
            switch destination {
            case .activity:
                break
            default:
                path.append(destination)
            }
        }
    }
}

