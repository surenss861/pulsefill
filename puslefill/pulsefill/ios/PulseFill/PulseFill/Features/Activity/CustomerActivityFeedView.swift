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
                    VStack(alignment: .leading, spacing: PFCustomerShellMetrics.sectionSpacing) {
                        PFEmberHero(
                            overline: "Activity",
                            title: "Opening updates",
                            subtitle: "See claims, confirmations, and missed openings in one timeline.",
                            uppercaseOverline: false
                        )
                        .customerAppearAnimation(staggerIndex: 0)

                        if !activityAboutCalloutSuppressed {
                            PFCustomerInfoCallout(
                                title: "How Activity works",
                                message:
                                    "We show changes in plain language. Tap a row when there is an opening or claim to review.",
                                variant: .neutral
                            )
                            .customerAppearAnimation(staggerIndex: 1)
                        }

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
                            PFErrorMoment(
                                title: "Couldn’t load updates",
                                message: PFCustomerFacingErrorCopy.sanitizeCustomerMessage(message),
                                actionTitle: "Reload updates",
                                action: { Task { await viewModel.load() } },
                                secondaryTitle: "View openings",
                                secondaryAction: { env.customerNavigation.openOffersInbox() }
                            )
                            .padding(.top, 8)

                            activityAboutFootnoteWhenFailed
                                .padding(.top, 4)

                        case .loaded:
                            let groups = customerActivityTimelineGroups(from: viewModel.filteredItems)
                            if groups.isEmpty {
                                PFEmptyMoment(
                                    systemImage: "list.bullet.rectangle",
                                    title: "No updates yet",
                                    message: "When you claim an opening or a booking is confirmed, it will show up here.",
                                    actionTitle: "View openings",
                                    action: { env.customerNavigation.openOffersInbox() }
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
                    .padding(.horizontal, PFCustomerShellMetrics.horizontalPadding)
                    .padding(.top, 24)
                    .padding(.bottom, PFCustomerShellMetrics.tabBarContentInset)
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

    /// Large “About” callout + full error card felt heavy; hide the callout while showing the error.
    private var activityAboutCalloutSuppressed: Bool {
        if case .failed = viewModel.loadState { return true }
        return false
    }

    private var activityAboutFootnoteWhenFailed: some View {
        Text(
            "We show changes in plain language — tap a row when there is an opening or claim to review."
        )
        .font(.system(size: 13, weight: .medium))
        .foregroundStyle(PFColor.customerMutedText)
        .lineSpacing(3)
        .frame(maxWidth: .infinity, alignment: .leading)
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
            StandbyStatusView(api: env.apiClient, onGoToProfileTab: {
                env.customerNavigation.selectedTab = .profile
            })

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
