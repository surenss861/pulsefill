import SwiftUI
import UserNotifications

/// Customer Home — continues the signed-out story: openings, standby, activity (no operator metrics).
struct HomeView: View {
    @EnvironmentObject private var env: AppEnvironment
    @AppStorage("pf.onboarding.standby.completed") private var standbyOnboardingCompleted = false
    @AppStorage("pf.onboarding.standbyFirstRunComplete") private var legacyStandbyComplete = false

    @State private var loadedOffers: [OfferInboxItem] = []
    @State private var activityPreview: [CustomerActivityItem] = []
    @State private var loading = true
    @State private var loadError: String?

    private var standbyActive: Bool {
        standbyOnboardingCompleted || legacyStandbyComplete
    }

    private var greetingLine: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5 ..< 12: return "Good morning"
        case 12 ..< 17: return "Good afternoon"
        default: return "Good evening"
        }
    }

    private var homeSpotlightOffer: OfferInboxItem? {
        for o in loadedOffers where !isExpired(o) {
            let s = o.status.lowercased()
            if ["sent", "delivered", "viewed", "pending"].contains(s) { return o }
        }
        return loadedOffers.first { !isExpired($0) }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: PFSpacing.lg) {
                    Text(greetingLine)
                        .font(.system(size: 30, weight: .bold))
                        .foregroundStyle(PFColor.textPrimary)

                    if loading {
                        ProgressView()
                            .tint(PFColor.primary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    } else if let loadError {
                        PFSurfaceCard {
                            VStack(alignment: .leading, spacing: PFSpacing.sm) {
                                PFTypography.caption(loadError)
                                Button("Try again") {
                                    Task { await refresh() }
                                }
                                .buttonStyle(.borderedProminent)
                                .tint(PFColor.primary)
                            }
                        }
                    } else if let offer = homeSpotlightOffer {
                        openingSection(offer: offer)
                    } else {
                        emptyOffersSection
                    }

                    standbySection
                    recentActivitySection

                    NavigationLink {
                        BusinessPickerView()
                    } label: {
                        Text("Choose business")
                            .font(.system(size: 15, weight: .semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                    }
                    .buttonStyle(.bordered)
                    .tint(PFColor.primary)
                }
                .padding(PFSpacing.lg)
            }
            .background(PFColor.background.ignoresSafeArea())
            .navigationTitle("Home")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(PFColor.surface1, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
        .tint(PFColor.primary)
        .task(id: env.sessionStore.userId) {
            await refresh()
        }
    }

    @ViewBuilder
    private func openingSection(offer: OfferInboxItem) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Opening available")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            Text(serviceLabel(for: offer))
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)

            Text(timeLine(for: offer))
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(PFColor.textSecondary)

            Button {
                env.customerNavigation.routeToOffersTab(offerId: offer.id, openSlotId: nil)
            } label: {
                Text("View offer")
                    .font(.system(size: 16, weight: .semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
            }
            .buttonStyle(.borderedProminent)
            .tint(PFColor.primary)
            .padding(.top, 4)
        }
        .padding(PFSpacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFColor.surface1)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .strokeBorder(Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    private var emptyOffersSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("No active offers right now.")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)
            Text("We’ll notify you when an earlier opening becomes available.")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(PFColor.textSecondary)
                .lineSpacing(3)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var standbySection: some View {
        VStack(alignment: .leading, spacing: PFSpacing.sm) {
            SectionHeaderView(title: "Standby")
            PFSurfaceCard {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(alignment: .firstTextBaseline) {
                        Text("Status")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(PFColor.textSecondary)
                        Spacer()
                        Text(standbyActive ? "Active" : "Not set up")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(standbyActive ? PFColor.success : PFColor.textSecondary)
                    }
                    if !standbyActive {
                        Button("Finish setup in Profile") {
                            env.customerNavigation.open(.standbyStatus)
                        }
                        .font(.system(size: 14, weight: .semibold))
                    }
                }
            }
        }
    }

    private var recentActivitySection: some View {
        VStack(alignment: .leading, spacing: PFSpacing.sm) {
            SectionHeaderView(title: "Recent activity")
            if activityPreview.isEmpty {
                Text("Nothing new yet — check back after offers arrive.")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
            } else {
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(activityPreview) { item in
                        activityRow(item)
                    }
                }
                .padding(PFSpacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(PFColor.surface1)
                .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                        .strokeBorder(Color.white.opacity(0.06), lineWidth: 1)
                )

                Button {
                    env.customerNavigation.selectedTab = .activity
                } label: {
                    Text("See all")
                        .font(.system(size: 15, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                }
                .buttonStyle(.bordered)
                .tint(PFColor.primary)
            }
        }
    }

    private func activityRow(_ item: CustomerActivityItem) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(item.title)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)
            Text(DateFormatterPF.relative(item.occurredAt))
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(PFColor.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func refresh() async {
        guard env.sessionStore.isSignedIn else {
            loadedOffers = []
            activityPreview = []
            loading = false
            loadError = nil
            return
        }

        loading = true
        loadError = nil

        let push = await Self.queryPushPermissionStatus()

        do {
            let offers = try await env.apiClient.get("/v1/customers/me/offers", as: OfferInboxResponse.self)
            loadedOffers = offers.offers
            loadError = nil
        } catch {
            loadError = APIErrorCopy.message(for: error)
            loadedOffers = []
        }

        if let activity = try? await env.apiClient.getCustomerActivityFeed(pushPermissionStatus: push) {
            activityPreview = Array(activity.items.prefix(2))
        } else {
            activityPreview = []
        }

        loading = false
    }

    private func isExpired(_ offer: OfferInboxItem) -> Bool {
        guard let expiresAt = offer.expiresAt,
              let exp = Self.parseISO(expiresAt)
        else { return false }
        return exp.timeIntervalSinceNow < 0
    }

    private func serviceLabel(for offer: OfferInboxItem) -> String {
        if let notes = offer.openSlot?.notes?.trimmingCharacters(in: .whitespacesAndNewlines), !notes.isEmpty {
            return notes
        }
        if let name = offer.openSlot?.providerNameSnapshot?.trimmingCharacters(in: .whitespacesAndNewlines), !name.isEmpty {
            return name
        }
        return "Earlier opening"
    }

    private func timeLine(for offer: OfferInboxItem) -> String {
        guard let slot = offer.openSlot else { return "Details in Offers" }
        let time = DateFormatterPF.time(slot.startsAt)
        guard let start = Self.parseISO(slot.startsAt) else {
            return "\(DateFormatterPF.short(slot.startsAt)) · \(time)"
        }
        if Calendar.current.isDateInToday(start) {
            return "Today · \(time)"
        }
        return "\(DateFormatterPF.short(slot.startsAt)) · \(time)"
    }

    private static func parseISO(_ value: String) -> Date? {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: value) { return d }
        f.formatOptions = [.withInternetDateTime]
        return f.date(from: value)
    }

    private static func queryPushPermissionStatus() async -> String {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        switch settings.authorizationStatus {
        case .authorized, .provisional, .ephemeral:
            return "authorized"
        case .denied:
            return "denied"
        case .notDetermined:
            return "not_determined"
        @unknown default:
            return "unknown"
        }
    }
}
