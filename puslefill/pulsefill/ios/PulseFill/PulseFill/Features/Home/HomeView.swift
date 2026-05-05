import SwiftUI
import UserNotifications

/// Customer Home — calm appointment assistant (openings, standby, activity).
struct HomeView: View {
    @EnvironmentObject private var env: AppEnvironment
    @AppStorage("pf.onboarding.standby.completed") private var standbyOnboardingCompleted = false
    @AppStorage("pf.onboarding.standbyFirstRunComplete") private var legacyStandbyComplete = false

    @State private var loadedOffers: [OfferInboxItem] = []
    @State private var activityPreview: [CustomerActivityItem] = []
    @State private var standbySummary: StandbyStatusSummary?
    @State private var loading = true
    @State private var loadError: String?

    private var standbyActiveLocal: Bool {
        standbyOnboardingCompleted || legacyStandbyComplete
    }

    /// Server or local onboarding: any active standby signal.
    private var standbyConfigured: Bool {
        standbyActiveLocal || (standbySummary?.hasAnyActivePreference ?? false)
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
            let rawDetail = customerActivityDetailLine(for: item)
            let detail = rawDetail.map { PFCustomerFacingErrorCopy.sanitizeCustomerMessage($0) }
            return CustomerHomeActivityRowModel(
                id: item.id,
                title: kind.title,
                detail: detail,
                relativeTime: DateFormatterPF.relative(item.occurredAt)
            )
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    CustomerHomeHeader(greeting: greetingLine, isSignedIn: env.sessionStore.isSignedIn)
                        .customerAppearAnimation(staggerIndex: 0)

                    if env.sessionStore.isSignedIn {
                        signedInContent
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 24)
                .padding(.bottom, 32)
            }
            .background(PFScreenBackground())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .navigationBar)
        }
        .tint(PFColor.ember)
        .task(id: env.sessionStore.userId) {
            await refresh()
        }
    }

    @ViewBuilder
    private var signedInContent: some View {
        if loading && loadedOffers.isEmpty {
            PFCustomerLoadingState(
                title: "Loading your home…",
                message: "Checking openings and standby status.",
                compact: false
            )
            .padding(.top, 8)
            .customerAppearAnimation(staggerIndex: 1)
        } else if let loadError {
            PFCustomerErrorState(
                title: "We couldn’t load everything",
                message: PFCustomerFacingErrorCopy.sanitizeCustomerMessage(loadError),
                primaryTitle: "Try again",
                primaryAction: { Task { await refresh() } },
                secondaryTitle: nil,
                secondaryAction: nil
            )
            .customerAppearAnimation(staggerIndex: 1)
        } else {
            homeHeroBlock
                .customerAppearAnimation(staggerIndex: 1)

            CustomerStandbyStatusCard(
                isActive: standbyConfigured,
                onSetup: {
                    env.customerNavigation.open(.standbyStatus)
                }
            )
            .customerAppearAnimation(staggerIndex: 2)

            CustomerRecentActivityCard(
                rows: homeActivityRows,
                onSeeAll: {
                    PFHaptics.lightImpact()
                    env.customerNavigation.open(.activity)
                }
            )
            .customerAppearAnimation(staggerIndex: 3)
        }
    }

    @ViewBuilder
    private var homeHeroBlock: some View {
        if let summary = standbySummary, summary.businessesCovered == 0 {
            CustomerHomeNextStepCard(
                kind: .findBusinesses,
                onFindBusinesses: { env.customerNavigation.selectedTab = .find },
                onStandbyStatus: { env.customerNavigation.open(.standbyStatus) },
                onNotificationSettings: { env.customerNavigation.open(.notificationSettings) }
            )
        } else if !standbyConfigured {
            CustomerHomeNextStepCard(
                kind: .setupStandby,
                onFindBusinesses: { env.customerNavigation.selectedTab = .find },
                onStandbyStatus: { env.customerNavigation.open(.standbyStatus) },
                onNotificationSettings: { env.customerNavigation.open(.notificationSettings) }
            )
        } else if let pick = homeSpotlight {
            CustomerOfferSpotlightCard(offer: pick.offer, displayStatus: pick.status) {
                env.customerNavigation.routeToOffersTab(offerId: pick.offer.id, openSlotId: nil)
            }
        } else {
            CustomerHomeNextStepCard(
                kind: .watchingForOpenings,
                onFindBusinesses: { env.customerNavigation.selectedTab = .find },
                onStandbyStatus: { env.customerNavigation.open(.standbyStatus) },
                onNotificationSettings: { env.customerNavigation.open(.notificationSettings) }
            )
        }
    }

    private func refresh() async {
        guard env.sessionStore.isSignedIn else {
            loadedOffers = []
            activityPreview = []
            standbySummary = nil
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

        do {
            let status = try await env.apiClient.getStandbyStatus(pushPermissionStatus: push)
            standbySummary = status.summary
        } catch {
            standbySummary = nil
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
