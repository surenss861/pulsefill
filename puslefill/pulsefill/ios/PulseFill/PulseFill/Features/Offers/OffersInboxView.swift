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
                            VStack(alignment: .leading, spacing: 16) {
                                OffersFocusHeader(liveCount: offers.count)
                                ForEach(offers) { item in
                                    NavigationLink(value: item.id) {
                                        OfferInboxRow(offer: item)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(.vertical, 20)
                            .padding(.horizontal, 20)
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
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(offer.openSlot?.providerNameSnapshot ?? "Open appointment")
                        .font(.system(size: 21, weight: .bold, design: .rounded))
                        .foregroundStyle(PFColor.textPrimary)
                    Text(subtitle)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(PFColor.textSecondary)
                }
                Spacer()
                StatusChipView(status: offer.status)
            }

            if let cents = offer.openSlot?.estimatedValueCents {
                HStack(spacing: 10) {
                    Text(CurrencyFormatter.currency(cents: cents))
                        .font(.system(size: 24, weight: .heavy, design: .rounded))
                        .foregroundStyle(PFColor.primary)
                    Text("estimated value")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(PFColor.textSecondary)
                }
            }

            HStack(spacing: 8) {
                offerPill(
                    title: expiryLabel,
                    tone: expiryTone
                )
                if offer.status.lowercased() == "sent" || offer.status.lowercased() == "delivered" {
                    offerPill(title: "Tap to claim", tone: .ready)
                }
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFColor.surface1.opacity(0.94))
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .stroke(PFColor.primaryBorder.opacity(0.55), lineWidth: 1)
        )
        .shadow(color: PFColor.primary.opacity(0.12), radius: 16, y: 8)
    }

    private var subtitle: String {
        guard let slot = offer.openSlot else { return "Pending details" }
        return "\(DateFormatterPF.short(slot.startsAt)) • \(DateFormatterPF.time(slot.startsAt))–\(DateFormatterPF.time(slot.endsAt))"
    }

    private var expiryLabel: String {
        guard let expiresAt = offer.expiresAt else { return "Claim soon" }
        guard let exp = parseISO(expiresAt) else { return "Claim soon" }
        let seconds = Int(exp.timeIntervalSinceNow)
        if seconds <= 0 { return "Expired" }
        let mins = max(1, seconds / 60)
        if mins < 60 { return "Expires in \(mins)m" }
        return "Expires in \(Int(round(Double(mins) / 60.0)))h"
    }

    private var expiryTone: OfferPillTone {
        guard let expiresAt = offer.expiresAt, let exp = parseISO(expiresAt) else { return .neutral }
        let seconds = exp.timeIntervalSinceNow
        if seconds <= 0 { return .danger }
        if seconds <= 15 * 60 { return .warn }
        return .neutral
    }

    private func parseISO(_ value: String) -> Date? {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: value) { return d }
        f.formatOptions = [.withInternetDateTime]
        return f.date(from: value)
    }

    private func offerPill(title: String, tone: OfferPillTone) -> some View {
        Text(title)
            .font(.system(size: 11, weight: .bold))
            .foregroundStyle(tone.fg)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(tone.bg)
            .clipShape(Capsule())
    }
}

private enum OfferPillTone {
    case neutral
    case warn
    case danger
    case ready

    var fg: Color {
        switch self {
        case .neutral: return PFColor.textSecondary
        case .warn: return PFColor.warning
        case .danger: return PFColor.error
        case .ready: return Color.black
        }
    }

    var bg: Color {
        switch self {
        case .neutral: return PFColor.surface2
        case .warn: return PFColor.warning.opacity(0.16)
        case .danger: return PFColor.error.opacity(0.16)
        case .ready: return PFColor.primary
        }
    }
}

private struct OffersFocusHeader: View {
    let liveCount: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("AVAILABLE OPENINGS")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(PFColor.textSecondary)
            Text(liveCount == 1 ? "1 live offer needs attention" : "\(liveCount) live offers need attention")
                .font(.system(size: 28, weight: .heavy, design: .rounded))
                .foregroundStyle(PFColor.textPrimary)
            Text("Claim quickly to reduce the chance of missing this opening.")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)
        }
        .padding(.bottom, 6)
    }
}
