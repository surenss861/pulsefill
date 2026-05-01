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
                PFScreenBackground()

                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        VStack(alignment: .leading, spacing: 8) {
                            PFTypography.Customer.screenTitle("Activity")
                                .multilineTextAlignment(.leading)

                            PFTypography.Customer.screenLead(
                                "A simple timeline of your standby, openings, claims, and confirmations."
                            )
                        }
                        .customerAppearAnimation(staggerIndex: 0)

                        PFCustomerInfoCallout(
                            title: "About Activity",
                            message:
                                "We show what changed in plain language — not technical codes. Tap a row when there’s something you can open or review.",
                            variant: .neutral
                        )
                        .customerAppearAnimation(staggerIndex: 1)

                        if env.sessionStore.isStaffUser {
                            VStack(alignment: .leading, spacing: 8) {
                                CustomerActivityFilterBar(selected: $viewModel.selectedFilter)
                                    .accessibilityLabel("Activity filter")
                            }
                            .customerAppearAnimation(staggerIndex: 2)
                        }

                        switch viewModel.loadState {
                        case .idle, .loading:
                            PFCustomerLoadingState(
                                title: "Loading activity…",
                                message: "Gathering your latest updates.",
                                compact: false
                            )
                            .padding(.top, 8)

                        case let .failed(message):
                            PFCustomerErrorState(
                                title: "Couldn’t load activity",
                                message: PFCustomerFacingErrorCopy.sanitizeCustomerMessage(message),
                                primaryTitle: "Try again",
                                primaryAction: { Task { await viewModel.load() } },
                                secondaryTitle: nil,
                                secondaryAction: nil
                            )
                            .padding(.top, 8)

                        case .loaded:
                            let groups = customerActivityTimelineGroups(from: viewModel.filteredItems)
                            if groups.isEmpty {
                                CustomerEmptyStateCard(
                                    systemImage: "list.bullet.rectangle",
                                    title: "No activity yet",
                                    message:
                                        "When something changes — a new opening, a claim, or a booking update — it’ll show up here.",
                                    footnote: nil,
                                    primaryActionTitle: "Browse openings",
                                    primaryAction: {
                                        env.customerNavigation.openOffersInbox()
                                    },
                                    secondaryActionTitle: "Standby status",
                                    secondaryAction: {
                                        env.customerNavigation.open(.standbyStatus)
                                    }
                                )
                                .customerAppearAnimation(staggerIndex: 3)
                            } else {
                                ForEach(Array(groups.enumerated()), id: \.element.id) { index, group in
                                    activitySection(group)
                                        .customerAppearAnimation(staggerIndex: index + 3)
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 24)
                    .padding(.bottom, 36)
                }
            }
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

            PFCustomerSectionCard(variant: .default, padding: 14) {
                VStack(spacing: 14) {
                    ForEach(group.rows) { row in
                        if let item = viewModel.filteredItems.first(where: { $0.id == row.id }) {
                            row.rowView {
                                handleActivityTap(item: item)
                            }
                        } else {
                            CustomerActivityRow(
                                title: row.title,
                                relativeTime: row.relativeTime,
                                detail: row.detail,
                                dot: row.dot,
                                statusChipKind: row.chipKind,
                                statusChipCaption: row.chipCaption
                            )
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
