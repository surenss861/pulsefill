import SwiftUI
import UserNotifications

/// Customer Home — calm appointment assistant (openings, standby, activity).
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

    private var homeSpotlight: (offer: OfferInboxItem, status: CustomerOfferDisplayStatus)? {
        homeSpotlightPick(from: loadedOffers)
    }

    private var homeActivityRows: [CustomerHomeActivityRowModel] {
        activityPreview.map { item in
            let kind = customerActivityDisplayKind(rawKind: item.kind)
            return CustomerHomeActivityRowModel(
                id: item.id,
                title: kind.title,
                detail: customerActivityDetailLine(for: item),
                relativeTime: DateFormatterPF.relative(item.occurredAt)
            )
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        CustomerHomeHeader(greeting: greetingLine)
                            .customerAppearAnimation(staggerIndex: 0)

                        if loading {
                            ProgressView()
                                .tint(PFColor.ember)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.vertical, 8)
                        } else if let loadError {
                            loadErrorCard(loadError)
                        } else if let pick = homeSpotlight {
                            CustomerOfferSpotlightCard(offer: pick.offer, displayStatus: pick.status) {
                                env.customerNavigation.routeToOffersTab(offerId: pick.offer.id, openSlotId: nil)
                            }
                            .customerAppearAnimation(staggerIndex: 0)
                        } else {
                            EmptyOfferStateCard(
                                onNotificationSettings: {
                                    env.customerNavigation.open(.notificationSettings)
                                },
                                onStandbyPreferences: {
                                    env.customerNavigation.open(.standbyStatus)
                                }
                            )
                            .customerAppearAnimation(staggerIndex: 0)
                        }

                        CustomerStandbyStatusCard(
                            isActive: standbyActive,
                            onSetup: {
                                env.customerNavigation.open(.standbyStatus)
                            }
                        )
                        .customerAppearAnimation(staggerIndex: 1)

                        CustomerRecentActivityCard(
                            rows: homeActivityRows,
                            onSeeAll: {
                                PFHaptics.lightImpact()
                                env.customerNavigation.open(.activity)
                            }
                        )
                        .customerAppearAnimation(staggerIndex: 2)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 24)
                    .padding(.bottom, 32)
                }
                .background(CustomerScreenBackground())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .navigationBar)
        }
        .tint(PFColor.ember)
        .task(id: env.sessionStore.userId) {
            await refresh()
        }
    }

    private func loadErrorCard(_ message: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Something went wrong")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(PFColor.textPrimary)
            Text(message)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(PFColor.textSecondary)
                .lineSpacing(3)
            Button("Try again") {
                Task { await refresh() }
            }
            .font(.system(size: 15, weight: .semibold))
            .foregroundStyle(PFColor.primaryText)
            .padding(.horizontal, 18)
            .padding(.vertical, 11)
            .background(Color.clear)
            .overlay(
                Capsule()
                    .stroke(PFColor.primaryBorder, lineWidth: 1)
            )
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFColor.surface1)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
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
