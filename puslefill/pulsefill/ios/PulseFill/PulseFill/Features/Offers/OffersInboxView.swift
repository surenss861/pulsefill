import SwiftUI

struct OffersInboxView: View {
    @EnvironmentObject private var env: AppEnvironment
    @State private var offers: [OfferInboxItem] = []
    @State private var loading = false
    @State private var errorMessage: String?
    @State private var navigationPath = NavigationPath()

    private var partitioned: (active: [OfferInboxItem], past: [OfferInboxItem]) {
        var active: [(OfferInboxItem, CustomerOfferDisplayStatus)] = []
        var past: [(OfferInboxItem, CustomerOfferDisplayStatus)] = []

        for offer in offers {
            let st = customerOfferDisplayStatus(forInbox: offer)
            if st.isClaimable {
                active.append((offer, st))
            } else {
                past.append((offer, st))
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

        active.sort { a, b in
            let da = slotStart(a.0) ?? .distantFuture
            let db = slotStart(b.0) ?? .distantFuture
            if da != db { return da < db }
            return (sentAt(a.0) ?? .distantPast) > (sentAt(b.0) ?? .distantPast)
        }

        past.sort { a, b in
            (sentAt(a.0) ?? .distantPast) > (sentAt(b.0) ?? .distantPast)
        }

        return (active.map(\.0), past.map(\.0))
    }

    var body: some View {
        NavigationStack(path: $navigationPath) {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    VStack(alignment: .leading, spacing: 8) {
                        PFTypography.Customer.screenTitle("Offers")
                            .multilineTextAlignment(.leading)

                        PFTypography.Customer.screenLead("Claim better appointment times when they become available.")
                    }
                    .customerAppearAnimation(staggerIndex: 0)

                    if loading {
                        ProgressView()
                            .tint(PFColor.ember)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.vertical, 12)
                    } else if let errorMessage {
                        CustomerEmptyStateCard(
                            systemImage: "exclamationmark.triangle",
                            title: "Couldn’t load openings",
                            message: errorMessage,
                            footnote: nil
                        )

                        CustomerPrimaryButton(title: "Try again") {
                            Task { await load() }
                        }
                    } else if offers.isEmpty {
                        CustomerEmptyStateCard(
                            systemImage: "bell.badge",
                            title: "No openings right now.",
                            message: "You’re still on standby for updates. We’ll notify you when a better appointment time opens up.",
                            footnote: "Keep notifications on so you don’t miss an opening.",
                            primaryActionTitle: "Check notification settings",
                            primaryAction: {
                                env.customerNavigation.open(.notificationSettings)
                            },
                            secondaryActionTitle: "Update standby preferences",
                            secondaryAction: {
                                env.customerNavigation.open(.standbyStatus)
                            }
                        )
                    } else {
                        let parts = partitioned
                        if !parts.active.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                PFTypography.Customer.label("Available openings")

                                ForEach(Array(parts.active.enumerated()), id: \.element.id) { index, item in
                                    let st = customerOfferDisplayStatus(forInbox: item)
                                    CustomerOfferCard(offer: item, displayStatus: st) {
                                        navigationPath.append(item.id)
                                    }
                                    .customerAppearAnimation(staggerIndex: index)
                                }
                            }
                        }

                        if !parts.past.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                PFTypography.Customer.label("Past openings")

                                ForEach(Array(parts.past.enumerated()), id: \.element.id) { index, item in
                                    let st = customerOfferDisplayStatus(forInbox: item)
                                    Button {
                                        PFHaptics.lightImpact()
                                        navigationPath.append(item.id)
                                    } label: {
                                        CustomerOfferPastCard(offer: item, displayStatus: st)
                                    }
                                    .buttonStyle(CustomerCardPressButtonStyle())
                                    .customerAppearAnimation(staggerIndex: index + parts.active.count)
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 24)
                .padding(.bottom, 36)
            }
            .background(CustomerScreenBackground())
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

    private func load() async {
        guard env.sessionStore.isSignedIn else {
            offers = []
            errorMessage = "Sign in from Home to load openings."
            return
        }
        loading = true
        errorMessage = nil
        defer { loading = false }
        do {
            let res = try await env.apiClient.get("/v1/customers/me/offers", as: OfferInboxResponse.self)
            offers = res.offers
        } catch {
            errorMessage = APIErrorCopy.message(for: error)
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
