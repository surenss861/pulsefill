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
                if let offer = offers.first(where: { $0.id == id }) {
                    OfferDetailView(offer: offer)
                } else {
                    EmptyStateView(
                        title: "Offer not found",
                        message: "Pull to refresh if this offer was just created.",
                        actionTitle: "Refresh",
                        action: { Task { await load() } }
                    )
                }
            }
            .task {
                await load()
                await handlePendingDestination()
            }
            .onChange(of: env.navigationRouter.pendingDestination) { _, _ in
                Task { await handlePendingDestination() }
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

    private func handlePendingDestination() async {
        guard let pending = env.navigationRouter.pendingDestination else { return }

        switch pending {
        case .offersInbox:
            env.navigationRouter.clearPendingDestination()
        case let .offerDetail(offerId, openSlotId):
            if offers.isEmpty {
                await load()
            }
            if let offerId,
               let matched = offers.first(where: { $0.id == offerId }) {
                navigationPath.append(matched.id)
            } else if let openSlotId,
                      let matched = offers.first(where: { $0.openSlotId == openSlotId }) {
                navigationPath.append(matched.id)
            }
            env.navigationRouter.clearPendingDestination()
        }
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
