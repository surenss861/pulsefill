import SwiftUI

struct OffersInboxView: View {
    @EnvironmentObject private var env: AppEnvironment
    @State private var offers: [OfferInboxItem] = []
    @State private var loading = false
    @State private var errorMessage: String?
    @State private var navigationPath = NavigationPath()

    private var partitioned: (available: [OfferInboxItem], waiting: [OfferInboxItem], history: [OfferInboxItem]) {
        var available: [(OfferInboxItem, CustomerOfferDisplayStatus)] = []
        var waiting: [(OfferInboxItem, CustomerOfferDisplayStatus)] = []
        var history: [(OfferInboxItem, CustomerOfferDisplayStatus)] = []

        for offer in offers {
            let st = customerOfferDisplayStatus(forInbox: offer)
            if st.isClaimable {
                available.append((offer, st))
            } else if st == .claimed {
                waiting.append((offer, st))
            } else {
                history.append((offer, st))
            }
        }

        func slotStart(_ o: OfferInboxItem) -> Date? {
            guard let raw = o.openSlot?.startsAt else { return nil }
            return CustomerStatusPresentersISO.parse(raw)
        }

        func sentAt(_ o: OfferInboxItem) -> Date? {
            guard let raw = o.sentAt else { return nil }
            return CustomerStatusPresentersISO.parse(raw)
        }

        available.sort { a, b in
            let da = slotStart(a.0) ?? .distantFuture
            let db = slotStart(b.0) ?? .distantFuture
            if da != db { return da < db }
            return (sentAt(a.0) ?? .distantPast) > (sentAt(b.0) ?? .distantPast)
        }

        waiting.sort { a, b in
            (sentAt(a.0) ?? .distantPast) > (sentAt(b.0) ?? .distantPast)
        }

        history.sort { a, b in
            (sentAt(a.0) ?? .distantPast) > (sentAt(b.0) ?? .distantPast)
        }

        return (available.map(\.0), waiting.map(\.0), history.map(\.0))
    }

    var body: some View {
        NavigationStack(path: $navigationPath) {
            ZStack {
                PFScreenBackground()
                ScrollView {
                    VStack(alignment: .leading, spacing: PFCustomerShellMetrics.sectionSpacing) {
                        PFEmberHero(
                            overline: "Openings",
                            title: "Appointments you can claim",
                            subtitle: "Cancelled times from your businesses show up here.",
                            uppercaseOverline: false,
                            primaryActionTitle: "Tell us what times work",
                            primaryAction: { env.customerNavigation.open(.standbyStatus) }
                        )
                        .customerAppearAnimation(staggerIndex: 0)

                        if loading && offers.isEmpty {
                            PFCustomerLoadingState(
                                title: "Loading openings…",
                                message: "Checking for openings that match your standby.",
                                compact: false,
                            )
                            .padding(.top, 8)
                        } else if !env.sessionStore.isSignedIn {
                            CustomerEmptyStateCard(
                                systemImage: "person.crop.circle.badge.questionmark",
                                title: "Sign in to see openings",
                                message: "Openings from businesses you’ve joined will appear here after you sign in.",
                                footnote: nil,
                            )
                        } else if let errorMessage {
                            PFErrorMoment(
                                title: "Couldn’t load openings",
                                message: PFCustomerFacingErrorCopy.sanitizeCustomerMessage(errorMessage),
                                actionTitle: "Reload openings",
                                action: { Task { await load() } },
                                secondaryTitle: "Standby preferences",
                                secondaryAction: { env.customerNavigation.open(.standbyStatus) }
                            )
                        } else if offers.isEmpty {
                            PFEmptyMoment(
                                systemImage: "bell.badge",
                                title: "No openings yet",
                                message: "When a business accepts you and your times are set, claimable appointments will show up here.",
                                actionTitle: "Find businesses",
                                action: { env.customerNavigation.openFindBusinesses() },
                                secondaryTitle: "Tell us what times work",
                                secondaryAction: { env.customerNavigation.open(.standbyStatus) }
                            )
                        } else {
                            if loading {
                                ProgressView()
                                    .tint(PFColor.ember)
                                    .frame(maxWidth: .infinity, alignment: .center)
                                    .padding(.vertical, 6)
                            }

                            let parts = partitioned
                            let waitingStaggerBase = parts.available.count
                            let historyStaggerBase = parts.available.count + parts.waiting.count

                            if !parts.available.isEmpty {
                                VStack(alignment: .leading, spacing: 12) {
                                    offersInboxSectionHeading("Ready to claim")

                                    ForEach(Array(parts.available.enumerated()), id: \.element.id) { index, item in
                                        let st = customerOfferDisplayStatus(forInbox: item)
                                        CustomerOfferCard(offer: item, displayStatus: st) {
                                            navigationPath.append(item.id)
                                        }
                                        .customerAppearAnimation(staggerIndex: index)
                                    }
                                }
                            }

                            if !parts.waiting.isEmpty {
                                VStack(alignment: .leading, spacing: 12) {
                                    offersInboxSectionHeading("Waiting on business")

                                    ForEach(Array(parts.waiting.enumerated()), id: \.element.id) { index, item in
                                        let st = customerOfferDisplayStatus(forInbox: item)
                                        CustomerOfferCard(
                                            offer: item,
                                            displayStatus: st,
                                            chromeActionTitle: "Track claim",
                                            openingLabel: "Waiting on business",
                                        ) {
                                            navigationPath.append(item.id)
                                        }
                                        .customerAppearAnimation(staggerIndex: waitingStaggerBase + index)
                                    }
                                }
                            }

                            if !parts.history.isEmpty {
                                VStack(alignment: .leading, spacing: 12) {
                                    offersInboxSectionHeading("Past openings")

                                    ForEach(Array(parts.history.enumerated()), id: \.element.id) { index, item in
                                        let st = customerOfferDisplayStatus(forInbox: item)
                                        Button {
                                            PFHaptics.lightImpact()
                                            navigationPath.append(item.id)
                                        } label: {
                                            CustomerOfferPastCard(offer: item, displayStatus: st)
                                        }
                                        .buttonStyle(CustomerCardPressButtonStyle())
                                        .customerAppearAnimation(staggerIndex: historyStaggerBase + index)
                                    }
                                }
                            }
                        }
                    }
                    .padding(.horizontal, PFCustomerShellMetrics.horizontalPadding)
                    .padding(.top, 24)
                    .pfCustomerTabBarContentInset()
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: String.self) { id in
                OfferDetailView(api: env.apiClient, offerId: id)
                    .environmentObject(env)
            }
            .task {
                await load()
                await handlePendingOfferRouting()
            }
            .refreshable { await load() }
            .onChange(of: env.customerNavigation.pendingOfferRouting) { _, _ in
                Task { await handlePendingOfferRouting() }
            }
            .onChange(of: env.customerNavigation.selectedTab) { _, tab in
                if tab == .offers {
                    Task { await handlePendingOfferRouting() }
                }
            }
        }
        .tint(PFColor.ember)
    }

    private func offersInboxSectionHeading(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(PFColor.customerDimText)
    }

    private func load() async {
        guard env.sessionStore.isSignedIn else {
            offers = []
            errorMessage = nil
            return
        }
        loading = true
        errorMessage = nil
        defer { loading = false }
        do {
            let res = try await env.apiClient.get("/v1/customers/me/offers", as: OfferInboxResponse.self)
            offers = res.offers
        } catch {
            errorMessage = PFCustomerFacingErrorCopy.sanitizeCustomerMessage(APIErrorCopy.message(for: error))
        }
    }

    private func handlePendingOfferRouting() async {
        guard let pending = env.customerNavigation.pendingOfferRouting else { return }
        if pending.offerId == nil, pending.openSlotId == nil {
            env.customerNavigation.clearPendingOfferRouting()
            return
        }

        if offers.isEmpty {
            await load()
        }
        if let offerId = pending.offerId,
           !offerId.isEmpty,
           let matched = offers.first(where: { $0.id == offerId }) {
            navigationPath.append(matched.id)
        } else if let openSlotId = pending.openSlotId,
                  !openSlotId.isEmpty,
                  let matched = offers.first(where: { $0.openSlotId == openSlotId }) {
            navigationPath.append(matched.id)
        } else if let offerId = pending.offerId, !offerId.isEmpty {
            navigationPath.append(offerId)
        }
        env.customerNavigation.clearPendingOfferRouting()
    }
}
