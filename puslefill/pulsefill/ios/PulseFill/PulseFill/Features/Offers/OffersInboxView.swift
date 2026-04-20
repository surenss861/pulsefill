import SwiftUI

struct OffersInboxView: View {
    @EnvironmentObject private var env: AppEnvironment
    @State private var offers: [OfferInboxItem] = []
    @State private var loading = false
    @State private var errorMessage: String?
    @State private var navigationPath = NavigationPath()

    var body: some View {
        NavigationStack(path: $navigationPath) {
            ZStack {
                PFColor.background.ignoresSafeArea()
                Group {
                    if loading {
                        ProgressView("Loading offers…")
                            .tint(PFColor.primary)
                    } else if let errorMessage {
                        EmptyStateView(
                            title: "Couldn’t load offers",
                            message: errorMessage,
                            actionTitle: "Retry",
                            action: { Task { await load() } }
                        )
                    } else if offers.isEmpty {
                        EmptyStateView(
                            title: "No live offers",
                            message: "When a slot matches your standby settings, it appears here.",
                            actionTitle: "Refresh",
                            action: { Task { await load() } }
                        )
                    } else {
                        ScrollView {
                            LazyVStack(spacing: 14) {
                                ForEach(offers) { item in
                                    NavigationLink(value: item.id) {
                                        OfferInboxRow(offer: item)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(.vertical, 20)
                            .padding(.horizontal, 4)
                        }
                        .refreshable { await load() }
                    }
                }
            }
            .navigationTitle("Offers")
            .toolbarBackground(PFColor.surface1, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .navigationDestination(for: String.self) { id in
                OfferDetailView(api: env.apiClient, offerId: id)
            }
            .task {
                await load()
                await handlePendingOfferRouting()
            }
            .onChange(of: env.customerNavigation.pendingOfferRouting) { _, _ in
                Task { await handlePendingOfferRouting() }
            }
            .onChange(of: env.customerNavigation.selectedTab) { _, tab in
                if tab == .offers {
                    Task { await handlePendingOfferRouting() }
                }
            }
        }
    }

    private func load() async {
        guard env.sessionStore.isSignedIn else {
            offers = []
            errorMessage = "Sign in on the Home tab to load offers."
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

private struct OfferInboxRow: View {
    let offer: OfferInboxItem

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(offer.openSlot?.providerNameSnapshot ?? "Open appointment")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(PFColor.textPrimary)
                    Text(subtitle)
                        .font(.system(size: 13))
                        .foregroundStyle(PFColor.textSecondary)
                }
                Spacer()
                StatusChipView(status: offer.status)
            }
            if let cents = offer.openSlot?.estimatedValueCents {
                Text(CurrencyFormatter.currency(cents: cents))
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(PFColor.primary)
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .stroke(PFColor.divider, lineWidth: 1)
        )
        .padding(.horizontal, 20)
    }

    private var subtitle: String {
        guard let slot = offer.openSlot else { return "Pending details" }
        return "\(DateFormatterPF.short(slot.startsAt)) • \(DateFormatterPF.time(slot.startsAt))–\(DateFormatterPF.time(slot.endsAt))"
    }
}
