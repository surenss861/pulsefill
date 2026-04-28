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
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    VStack(alignment: .leading, spacing: 8) {
                        PFTypography.Customer.screenTitle("Activity")
                            .multilineTextAlignment(.leading)

                        PFTypography.Customer.screenLead("A simple timeline of your offers and booking updates.")
                    }
                    .customerAppearAnimation(staggerIndex: 0)

                    if env.sessionStore.isStaffUser {
                        CustomerActivityFilterBar(selected: $viewModel.selectedFilter)
                            .customerAppearAnimation(staggerIndex: 1)
                    }

                    switch viewModel.loadState {
                    case .idle, .loading:
                        ProgressView()
                            .tint(PFColor.ember)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.vertical, 12)

                    case let .failed(message):
                        CustomerEmptyStateCard(
                            systemImage: "exclamationmark.triangle",
                            title: "Couldn’t load activity",
                            message: message,
                            footnote: nil
                        )
                        CustomerPrimaryButton(title: "Try again") {
                            Task { await viewModel.load() }
                        }

                    case .loaded:
                        let groups = customerActivityTimelineGroups(from: viewModel.filteredItems)
                        if groups.isEmpty {
                            CustomerEmptyStateCard(
                                systemImage: "list.bullet.rectangle",
                                title: "No activity yet.",
                                message: "When something changes — a new opening, a claim, or a booking update — it’ll show up here.",
                                footnote: nil,
                                primaryActionTitle: "Browse openings",
                                primaryAction: {
                                    env.customerNavigation.openOffersInbox()
                                },
                                secondaryActionTitle: "Update standby preferences",
                                secondaryAction: {
                                    env.customerNavigation.open(.standbyStatus)
                                }
                            )
                            .customerAppearAnimation(staggerIndex: 2)
                        } else {
                            ForEach(Array(groups.enumerated()), id: \.element.id) { index, group in
                                activitySection(group)
                                    .customerAppearAnimation(staggerIndex: index + 2)
                            }
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 24)
                .padding(.bottom, 36)
            }
            .background(CustomerScreenBackground())
            .navigationTitle("Activity")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(PFColor.customerTabBar, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .task {
                await viewModel.load()
                consumePendingRoute()
            }
            .refreshable { await viewModel.refresh() }
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
        .tint(PFColor.ember)
    }

    @ViewBuilder
    private func activitySection(_ group: CustomerActivityTimelineGroup) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(group.sectionTitle)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(PFColor.customerDimText)

            CustomerSectionCard(padding: 14) {
                VStack(spacing: 14) {
                    ForEach(group.rows) { row in
                        if let item = viewModel.filteredItems.first(where: { $0.id == row.id }) {
                            row.rowView {
                                handleActivityTap(item: item)
                            }
                        } else {
                            CustomerActivityRow(title: row.title, relativeTime: row.relativeTime, detail: row.detail, dot: row.dot)
                        }
                    }
                }
            }
        }
    }

    private func handleActivityTap(item: CustomerActivityItem) {
        if let dest = CustomerRouteMapper.destinationForActivityItem(item) {
            env.customerNavigation.open(dest)
        }
    }

    @ViewBuilder
    private func destinationView(for destination: CustomerDestination) -> some View {
        switch destination {
        case let .offerDetail(offerId):
            OfferDetailView(api: env.apiClient, offerId: offerId)
                .environmentObject(env)

        case let .claimOutcome(claimId):
            ClaimOutcomeView(api: env.apiClient, claimId: claimId)

        case .missedOpportunities:
            MissedOpportunitiesView(api: env.apiClient)

        case .standbyStatus:
            StandbyStatusView(api: env.apiClient)

        case .notificationSettings:
            NotificationPreferencesView(api: env.apiClient)

        case .activity:
            EmptyView()
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
